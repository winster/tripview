// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ionic.contrib.ui.tinderCards'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs).
    // The reason we default this to hidden is that native apps don't usually show an accessory bar, at
    // least on iOS. It's a dead giveaway that an app is using a Web View. However, it's sometimes
    // useful especially with forms, though we would prefer giving the user a little more room
    // to interact with the app.
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // Set the statusbar to use the default style, tweak this to
      // remove the status bar on iOS or change it to use white instead of dark colors.
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.backButton.text('').icon('ion-chevron-left').previousTitleText(false);

  $urlRouterProvider.otherwise('/search')

  $stateProvider.state('search', {
    url: '/search',
    templateUrl: "templates/search.html",
    controller: 'SearchCtrl'
  });

  $stateProvider.state('trip', {
    url: '/trip',
    templateUrl: "templates/trip.html",
    controller: 'TripCtrl'
  });

  $stateProvider.state('help', {
    url: '/help',
    views: {
      help: {
        templateUrl: 'templates/help.html'
      }
    }
  });

})
.service('TripService', function($q) {
  var trip={};
  var reco={};
  var tripkey, recokey;
  return {    
    setTrip: function(key, data) {
      trip[key] = data;
    },
    getTrip: function(key) {
      return trip[key].model
    },
    setReco: function(key, data) {
      reco[key] = data;
    },
    getReco: function(key) {
      return reco[key].model
    },
    setTripKey: function(key){
      tripkey = key;
    },
    getTripKey: function(){
      return tripkey;
    },
    setRecoKey: function(key){
      recokey = key;
    },
    getRecoKey: function(){
      return recokey;
    }
  }
})
.controller('SearchCtrl', ['$scope','$state', '$ionicPopup', 'TripService',function($scope, $state, $ionicPopup, TripService) {
  $scope.recloc=$scope.recloc || '2ZX97P';
  $scope.lastname=$scope.lastname || 'jose';
  $scope.aetm = false;
  $scope.tripkey=$scope.lastname+':'+$scope.recloc;
  this.amaConfig = {
        trip: {
            URL:"https://www.checkmytrip.com/cmt/apf/mcmtng2/",
            SITE:"NCMTNCMT",
            OCTX:"TCUAT"
        },
        reco: {
            URL:"https://ncmt1.dev.amadeus.net/cmt/apf/recoengine/",
            SITE:"NCMTNCMT",
            OCTX:"TCUAT"
        },
        aetm:{
            URL:"http://aetm-me1.dev.amadeus.net/aetm/apf/aetmme/",
            SITE:"YCGAYCGA",
            OCTX:"MOBILE"
        },
        APPVERSION : "V5",
        LANGUAGE : "GB"
    };
  
  var amaInt = com.ama.atm(this.amaConfig);
      
  $scope.retrieve = function(recloc, lastname, aetm) {
    $scope.spinner=true;
    var req = {"lastName":lastname,"recLoc": recloc, aetm: aetm};
    amaInt.retrieveTrip(req, receiveTripResponse);
  };

  $scope.toggleTripSource = function(){
    $scope.aetm=!$scope.aetm; 
  };

  var receiveTripResponse = function(res) {
    TripService.setTrip($scope.tripkey, res);
    var trip = TripService.getTrip($scope.tripkey);
    if(trip.airItineraries)
      getRecoAct(trip);
    else 
      showAlert();   
      $scope.spinner=false; 
  };

  var showAlert = function() {
     var alertPopup = $ionicPopup.alert({
       title: 'Sorry :(',
       template: 'No trip found'
     });
     alertPopup.then(function(res) {
       console.log('No trip found');
     });
   };

  var getRecoAct = function(trip) {
    var req = {};
    req.userCountry=trip.airItineraries[0].arrivalLocation.countryCode;
    req.recLoc=$scope.recloc;
    req.currency=trip.airItineraries[0].arrivalLocation.currency.code;
    req.destinationCityCode=trip.airItineraries[0].arrivalLocation.cityCode;
    req.destinationCityName=trip.airItineraries[0].arrivalLocation.cityName;
    req.destinationCountryCode=trip.airItineraries[0].arrivalLocation.countryCode;
    req.departureDateTime=millisToYYYYMMDD(trip.airItineraries[0].arrivalDate.timeStamp);
    if(trip.airItineraries.length==2)
      req.arrivalDateTime=millisToYYYYMMDD(trip.airItineraries[1].departureDate.timeStamp);
    else {
      var date = new Date(trip.airItineraries[0].arrivalDate.timeStamp);
      date.setDate(date.getDate() + 1);      
      req.arrivalDateTime=millisToYYYYMMDD(date.getTime());
    }
    $scope.recokey=$scope.recloc+':'+req.destinationCityCode+':'+req.departureDateTime+':'+req.arrivalDateTime;
    amaInt.getRecommendationActivities(req, receiveRecoResponse);
  };

  var receiveRecoResponse = function(res) {
    TripService.setReco($scope.recokey, res);
    TripService.setTripKey($scope.tripkey)
    TripService.setRecoKey($scope.recokey)
    $scope.spinner=false;
    $state.go('trip');
  };

  var millisToYYYYMMDD = function(input) {
      var date = new Date(input)
      var formattedDate = date.getFullYear()+'-'+(date.getMonth()+1) +'-'+date.getDate();      
      return formattedDate;
  };

}])

.controller('TripCtrl', ['$scope','$ionicModal', '$timeout', 'TripService',function($scope, $ionicModal, $timeout, TripService) {
    
    $scope.trip = TripService.getTrip(TripService.getTripKey());
    $scope.reco = TripService.getReco(TripService.getRecoKey());
    $scope.cards = $scope.reco.recommendations;
    if($scope.cards && $scope.cards.length)
      $scope.recoshow = true;
    $scope.cardDestroyed = function(index) {
      $scope.cards.splice(index, 1);
      if($scope.cards.length==0)
          $scope.recoshow = false;
    };

    $scope.cardSwiped = function(index) {
      /*var newCard = // new card data
      $scope.cards.push(newCard);*/
    };
}]);
