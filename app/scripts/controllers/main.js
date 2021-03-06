'use strict';
/* global google */
function degToRad(deg) {
  return deg * (Math.PI/180);
}

app.controller('MainCtrl', function($scope, $http) {
  function calcDist(lat, lng) {
    var earthRadius = 6371;
    var dLat = degToRad(lat - $scope.currentLat);
    var dLng = degToRad(lng - $scope.currentLng);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(degToRad(lat)) * Math.cos(degToRad($scope.currentLat)) * Math.sin(dLng/2) * Math.sin(dLng/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = earthRadius * c;

    return Math.round(d);
  }


  // Should probably be its own service
  $scope.cons = {};
  $http.get('hackathons.json').
    success(function(response) {
      $scope.cons = response;
      $scope.cons.forEach(function (con) {
        con.start = Date.parse(con.start);
        con.end = Date.parse(con.end);
      });
    }).
    error(function(response) {
      addAlert(response);
    });

  $scope.geolocate = function() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
            $scope.$apply(function() {
              $scope.currentLat = position.coords.latitude;
              $scope.currentLng = position.coords.longitude;
              afterLocationGet();
            });
          },
          function(error) {
            addAlert('Something went wrong with geolocation! Try again in a bit. Error: ' + error.code + ', ' + error.message);
          });
    } else {
      addAlert('Sorry, geolocation isn\'t supported by your browser. Try entering a place instead (or update your browser!)');
    }
  };

  $scope.geocode = function() {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': $scope.address}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        $scope.$apply(function() {
          $scope.currentLat = results[0].geometry.location.lat();
          $scope.currentLng = results[0].geometry.location.lng();
          afterLocationGet();
        });
      } else {
        addAlert('Something went wrong with getting your location! Try again in a bit. Error: ' + status);
      }
    });
  };

  function afterLocationGet() {
    $scope.cons.forEach(function (con) {
      con.distance = calcDist(con.lat, con.lng);
    });
    $scope.locationLoaded = true;
    $scope.sort = 'distance';

    $scope.map.center = {
      latitude: $scope.currentLat,
      longitude: $scope.currentLng
    };
  }

  $scope.sort ='name';

  $scope.setSort = function(sort) {
    $scope.sort = sort;
  };

  // Alerts (should probably be its own controller)
  $scope.alerts = [];
  function addAlert(msg, type) {
    type = typeof type !== 'undefined' ? type : 'danger';
    $scope.$apply(function(){$scope.alerts.push({msg: msg, type: type});});
  }
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  $scope.map = {
    center: {
      latitude: 49,
      longitude: -122
    },
    zoom: 4
  };
});