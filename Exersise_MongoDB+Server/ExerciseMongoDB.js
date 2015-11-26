
var http = require('http'),
    url = require('url'),
    MongoClient  = require('mongodb').MongoClient ;

http.createServer( function (req, res){
    res.writeHead(200, {'Content-Type':'text/plain'});
    var subpathRaw = url.parse(req.url).pathname;
    if (subpathRaw[subpathRaw.length] != "/")
        subpathRaw+="/"; // Abschlieﬂendes Trennzeichen falls fehlt
    var collectionName = '';
    if (subpathRaw.length != null) {
        var subpath = subpathRaw[0];//keep first slash
    }
    var query = '';
    var i = 1;
    while(i<subpathRaw.length && subpathRaw[i]!="/"){
        collectionName += subpathRaw[i];
        subpath += subpathRaw[i];
        i++;
    }
    i++;//escape slash
    while(i<subpathRaw.length){
        //ToDo: Query Decoder Logik. Bsp Input URL: http://127.0.0.1:1337/MeineKatzen/farbe:rot/
        query += subpathRaw[i];
        i++;
    }
    console.log("collection path from URL: " + subpath);
    console.log(collectionName);
    console.log(query);

    MongoClient.connect('mongodb://localhost:27017'+subpath,  function(err,  db) {
        if (db != null) {
            var collection = db.collection(collectionName);
            console.log("MongoDB connected correctly to "+collectionName);
            var res = collection.find({}).stream({
                transform: function(doc){
                    return JSON.stringify(doc);
                }
            });

            res.on('data', function(doc){
                //console.log(doc);
            });

            res.on('end', function(){
                db.close();
            });

        }
        else console.log("mongo connection failed, check if mongoserver is running")
    });
res.end("Hello World\n");
}). listen(1337, '127.0.0.1' );

