// list functions =================================================================


var mainController = function ($scope, $http) {
//mainController', ['$scope', function ($scope) {
    $scope.World = "test";

    $scope.date = new Date();
    $scope.loggedIn = false;
    $scope.username = "Klaus";

    $scope.login = function () {
        //$scope.username = $scope.user.text;
    };

    $scope.formData = {};
    $scope.currentDay = new Date().toDateString();



    // when submitting the add form, send the text to the node API
    $scope.createTodo = function (listnameToInsert, listOwner) {
        if ($scope.formData.text != undefined &&$scope.formData.text!=""){
            $http.post('/saveNewTodo', {
                value: $scope.formData.text,
                listnameToInsert:listnameToInsert,
                listOwner:listOwner
            })
                .then(function (data) {
                    if(data.data.success==true){
                        $scope.models.lists[listnameToInsert].push({
                            dependingList: listnameToInsert,
                            label:  $scope.formData.text,
                            listOwner: listOwner,
                            isDoneList: false});
                        $scope.formData = {}; // clear the form so our user is ready to enter another
                    }
                }, function (error) {
                    console.log('Error: ' + error);
                });
        }


    };

    $scope.createList= function () {
        if ($scope.formData.text != undefined &&$scope.formData.text!=""){
            $http.post('/saveNewList', {
                listname: $scope.formData.text,
                listOwner:$scope.username
            })
                .then(function (data) {
                    if(data.data.success==true){
                        $scope.models.lists[$scope.formData.text]=[];
                        $scope.formData = {}; // clear the form so our user is ready to enter another
                    }
                }, function (error) {
                    console.log('Error: ' + error);
                });
        }


    };

    // move to 'done' list when checked
    $scope.changeTodoStatus = function (listOwner, listName, value, isChecked) {

        console.log(listOwner);
        console.log(listName);
        console.log(value);
        console.log(isChecked);

        //listowner = user or public
        $http.post('/changeTodoStatus', {
            listOwner: listOwner, listName: listName, value: value, isChecked:isChecked
        })
            .then(function (data) {

                // console.log("finish data: " + data);
                $scope.todos = data.data;
            }
            , function (error) {
                console.log('Error: ' + error);
            });

    };


    $scope.current = 0;

    $scope.list = {};

// DND Lists Stuff ============================================================
    /*$scope.models.selected = function(){
     console.log("check");
     }
     */

    console.log($scope);



    $scope.abboList = function (abboList) {

        $http.post('/abboList',{username: $scope.username , abboList: abboList }).then(function (response) {

        });

    };


    $scope.logMeIn = function (username) {
        $scope.username = username;
        $scope.loggedIn = true;

        $http.get('/todos/'+$scope.username).then(function (response) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.models = response.data;
        }, function (error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('Error: ' + error);
        });

        $http.get('/Public').then(function (response) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.publicLists = response.data;
        }, function (error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log('Error: ' + error);
        });

    }



    $scope.changePublicMode = function (listname){
        $http.post('/changePublicMode', {listname:listname, username:$scope.username}).then(function (data) {
            if(data.data.success==true){

            }

        }, function (error) {
            console.log('Error: ' + error);
        });;

    };
    $scope.dropCallback = function (event, index, item, external, type, targetList, targetListOwner) {
        console.log(event);
        console.log(index);
        console.log(item);
        console.log(external);
        console.log(type);
        console.log(targetListOwner);

        item.targetList = targetList;
        item.targetListOwner = targetListOwner;

        $http.post('/moveTodo', item).then(function (data) {
            if(data.data.success==true){
                $scope.models.lists[targetList].push({
                    dependingList: targetList,
                    label: item.label,
                    isDoneList: item.isDoneList,
                    listOwner: targetListOwner});

                var currentList =  $scope.models.lists[item.dependingList];
                for(var i in currentList){
                    if( currentList[i].label==item.label){
                        currentList.splice(i,1);
                        break;
                    }

                }
            }

        }, function (error) {
            console.log('Error: ' + error);
        });;


    };


};

// login routing ================================================================
/*
 angularTodoApp.config(function ($routeProvider, $locationProvider) {
 $routeProvider.
 when("/persons",
 {templateUrl: "./public/index.html"}).
 when("/",
 {templateUrl: "./public/login.html", controller: "LoginCtrl"}).
 // event more routes here ...
 otherwise({redirectTo: "/persons"});
 }).
 run(function ($rootScope, $location) {
 $rootScope.$on("$routeChangeStart", function (event, next, current) {
 if ($rootScope.loggedInUser == null) {
 // no logged user, redirect to /login
 if (next.templateUrl === "./public/login.html") {
 } else {
 $location.path("/login");
 }
 }
 });
 });

 angularTodoApp.config(['$httpProvider', function ($httpProvider) {
 $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
 }]);

 angularTodoApp.controller("LoginCtrl", function($scope, $location, $rootScope) {
 $scope.login = function() {
 $rootScope.loggedInUser = $scope.username;
 $location.path("/persons");
 };
 });

 */

angular.module("demo", ['dndLists']).controller("SimpleDemoController", function ($scope) {


});


angular.module('angularTodoApp', ['ngAnimate', 'ui.bootstrap', 'dndLists'])
    .controller('mainController', mainController);



