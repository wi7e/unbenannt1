/**
 * Created by niemand on 27.12.2015.
 */

//  setup =================================
var express = require('express');
var app = express();
//var nohm = require('nohm').Nohm; //
var redis = require('redis');
var redisClient = redis.createClient(), multi;
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var user;
var path = require('path');


// configuration ==========================
app.use(express.static('public'));
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());
//nohm.setClient(redisClient);
app.set('port', 1337);


redisClient.on("error", function (err) {
    console.log("redis: " + err);
});


// routes ==================================================================

// api ---------------------------------------------------------------------

app.get('/Public', function (req, res) {
    // get tdo-lists from url.user_lists/:userName

        redisClient.smembers('Public', function (err, results) {
            if (err)
                res.send(err);
            else
            //  console.log(username);
            //console.log(results);
                res.json(results);
        });

});



app.get('/todos/*', function (req, res) {
    var username = path.basename(req.url);
    var jsondata = {
        selected: null,
        lists: {}
    };
    var oldDay;
    redisClient.get('currentDay:' + username, function (err, day) {
        if (err)
            console.log(err);
        oldDay = day;


        //get user lists / DB-struct: users:lists:todos
        redisClient.smembers(username, function (err, lists) {
            if (err)
                res.send(err);
            else {
                if (lists != null) {
                    //lists = lists.sort();

                    multi = redisClient.multi(); //redis command chain

                    for (var i in lists) {
                        var gotworkBacklog = false;
                        var gotPrivateBacklog = false;
                        var gotCurrentDay = false;


                        if (lists[i] == "Private Backlog") {
                            gotPrivateBacklog = true;
                        }
                        if (lists[i] == "Work Backlog") {
                            gotworkBacklog = true;
                        }

                        if (oldDay != null && oldDay == new Date().toDateString() && lists[i] == new Date().toDateString()) {
                            gotCurrentDay = true;
                        }
                    }

                    if (!gotCurrentDay) {
                        var newDay = new Date().toDateString();
                        multi.set('currentDay:' + username, newDay);
                        //console.log("oldDay =" + oldDay);
                        multi.srem(username, oldDay);
                        multi.sadd(username, newDay);
                    }

                    if (!gotPrivateBacklog) {
                        multi.sadd(username, "Private Backlog");
                    }
                    if (!gotworkBacklog) {
                        multi.sadd(username, "Work Backlog");
                    }
                    multi.exec(function (err, todos) {
                        if (err)
                            console.log(err);
                        else {


                            redisClient.smembers(username, function (err, updatedList) {
                                if (err)
                                    res.send(err);
                                else {
                                    if (updatedList != null) {


                                        multi = redisClient.multi();
                                        for (var i in updatedList) {
                                            multi.smembers(username + ":" + updatedList[i]);
                                            multi.smembers(username + ":" + updatedList[i]+"_done");
                                        }
                                        multi.exec(function (err, todos) {
                                            console.log(updatedList);
                                            console.log(todos);
                                            if (err)
                                                console.log(err);
                                            else {
                                                //todos = todos.sort();

                                                for (var i=0; i<updatedList.length;i++) {

                                                    var todoJson = [];

                                                    for (var j in todos[i*2]) {

                                                        todoJson.push({
                                                            label: todos[i*2][j],
                                                            dependingList: updatedList[i],
                                                            listOwner: username,
                                                            isDoneList: false
                                                        });
                                                    }


                                                        todoJson.push({
                                                            label: "done Todos ("+todos[i*2+1].length+")",
                                                            dependingList: updatedList[i],
                                                            listOwner: username,
                                                            isDoneList: true

                                                        });


                                                    jsondata.lists[updatedList[i]] = todoJson;

                                                }


                                                res.json(jsondata);
                                            }
                                        });


                                    }
                                }

                            });


                        }
                    });



                }


            }
        });
        // get todos from url.todos/:userName/:listenName
        // unique list = userName(unique) + listName
    });

});

app.post('/abboList', function (req, res) {
    redisClient.sadd(req.body.username, req.body.abboList);
});

app.post('/moveTodo', function (req, res) {
    res.success = false;
    redisClient.sadd(req.body.targetListOwner, req.body.targetList);
    redisClient.smove(req.body.listOwner + ":" + req.body.dependingList,
        req.body.targetListOwner + ":" + req.body.targetList,
        req.body.label, function (err, feedback) {
            if (err)
                res.send(err);
            else {
                if (feedback == 1) {
                    res.json({success: true});
                } else {
                    res.json({success: false});
                }

            }
        });
});


app.post('/saveNewList', function (req, res) {
    // put TD into listName = (username + _listName)

    var r = req.body;
    res.success = false;
    //listOwner = username logged in
    redisClient.sadd(r.listOwner,
        r.listname,
        function (err, feedback) {
            if (err)
                res.send(err);
            else {
                if (feedback == 1) {
                    res.json({success: true});
                } else {
                    res.json({success: false});
                }

            }
        });


});

app.post('/saveNewTodo', function (req, res) {
    // put TD into listName = (username + _listName)
    var r = req.body;
    res.success = false;
    //listOwner = username logged in
    redisClient.sadd(r.listOwner, r.listnameToInsert);
    redisClient.sadd(r.listOwner + ":" + r.listnameToInsert,
        r.value,
        function (err, feedback) {
            if (err)
                res.send(err);
            else {
                if (feedback == 1) {
                    res.json({success: true});
                } else {
                    res.json({success: false});
                }

            }
        });


});

app.post('/changeTodoStatus', function (req, res) {

//  move TDo into listname = (listname + _done)
    res.success = false;
    var r = req.body;

    //listOwner: listOwner, listName: listName, value: value, isChecked:isChecked
    if(r.isChecked){

        redisClient.smove((r.listOwner + ":" + r.listName),
            (r.listOwner + ":" + r.listName + "_done"),
            r.value,
            function (err, feedback) {
                if (err)
                    res.send(err);
                else {
                    if (feedback == 1) {
                        res.json({success: true});
                    } else {
                        res.json({success: false});
                    }

                }
            }
        );
    }else{
        redisClient.smove((r.listOwner + ":" + r.listName+ "_done"),
            (r.listOwner + ":" + r.listName),
            r.value,
            function (err, feedback) {
                if (err)
                    res.send(err);
                else {
                    if (feedback == 1) {
                        res.json({success: true});
                    } else {
                        res.json({success: false});
                    }

                }
            }
        );
    }
});

app.post('/changePublicMode', function (req, res) {
    res.success = false;
    var r = req.body;

    redisClient.sismember('Public',r.username+":"+ r.listname, function (err, results) {
        if(results==1){
            redisClient.srem("Public",r.username+":"+ r.listname);
        }else{
            redisClient.sadd("Public",r.username+":"+ r.listname);
        }


    });


    //{ listname: 'Einkaufen', username: 'Johanna' }
    //redisClient.sadd(r.targetListOwner, req.body.targetList);

});
// route example ===============================================================
// get all todos
app.get('/todos', function (req, res) {
    redisClient.smembers('test', function (err, results) {

        // if there is an error retrieving, send the error. nothing after res.send(err) will execute
        if (err)
            res.send(err);
        else
            res.json(results);
    });
});

app.delete('*', function (req, res) {
    if (req.params[0] != null) {
        var todo = decodeURI(req.params[0]); // URL to String
        todo = todo.replace(/\//g, '');
        redisClient.srem('test', todo
            , function (err) {
                if (err)
                    res.send(err);
                else
                // get and return all the todos after you create another
                    redisClient.smembers('test', function (err, todos) {
                        if (err)
                            res.send(err);
                        else
                            res.send(todos);
                    });
            });
    }
});

// single view route ==============================================================

app.get('*', function (req, res) {
    //res.sendFile('index.html', { root: path.join(__dirname, '../public') });
    res.sendFile(__dirname + '/public/login.html'); // load the single view file (angular will handle the page changes on the front-end)
});

app.listen(1337);