angular.module('starter', ['ionic','ngCordova','angular-svg-round-progressbar',])

.run(function($ionicPlatform) {
  $ionicPlatform.registerBackButtonAction(function(e) {
    e.preventDefault();
  }, 101);
  $ionicPlatform.ready(function() {

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
        StatusBar.hide();
    }
  });
})


.directive('backgroundImage', function(){
	return function(scope, element, attrs){
	// restrict:'A',
		attrs.$observe('backgroundImage', function(value) {
			element.css({
				'background-image': 'url(' + value +')',
                'background-size':'cover',
                'background-position': 'center center'
			});
		});
	};
})

.controller('AppCtrl', function(FileService,Data,$interval,$ionicLoading, $timeout, $ionicSlideBoxDelegate,$ionicPopup,$ionicActionSheet,$scope,$ionicHistory, $http,$ionicPlatform, $cordovaFileTransfer, $cordovaFile,$q) {


  $ionicPlatform.ready(function() {
    init();
    $scope.$apply();
  });
    
  function init(){
    $scope.images = FileService.images();
    $ionicHistory.clearCache();
    var url = localStorage.getItem('slideURL');
    if(!url){
      config();
    }else if ($scope.images.length==0) {
      $http.get(url).then(function(res){
        $scope.totalImages = res.data;                 
        angular.forEach($scope.totalImages,function(i) {
          console.log(i);
          FileService.saveImage(i);
        });
      });
    }  
  }
  
  function reset(){
    window.location.reload();
    init();
  }

  function config(){
    $scope.data = {};
    var popup = $ionicPopup.show({
              template: '<input type="text" ng-model="data.url">',
              title: 'Masukkan URL',
              subTitle: 'Digunakan untuk memuat gambar',
              scope: $scope,
              buttons: [
                { text: 'Cancel' },
                { text: '<b>Save</b>',
                  type: 'button-positive',
                  onTap: function(e) {
                    if (!$scope.data.url) {
                      e.preventDefault();
                    } else {
                      return $scope.data.url;
                    }
                  }
                }
              ]
    });
    popup.then(function(res){
      console.log(res);
      localStorage.setItem('slideURL',res);
      localStorage.removeItem('slideImageData');
      init();
    })
  }
  $scope.$watchCollection('images', function(newNames, oldNames) {
    if(newNames.length ==$scope.totalImages.length){
      $ionicSlideBoxDelegate.update();
    }$scope.images = FileService.images();
  });
  $scope.setting = function(){
     $ionicActionSheet.show({
      buttons: [ { text: '<i class="icon ion-android-refresh"></i>Reset' }, { text: '<i class="icon ion-android-settings"></i>Setting' },],
      destructiveText: '<i class="icon ion-android-exit assertive"></i>Exit',
      buttonClicked: function(index) {
        switch (index){
          case 0: reset();break;
          case 1: config();break;
          default:
        }
        return true;
      },
      destructiveButtonClicked: function() {
        navigator.app.exitApp();
        return true;
      }
    });
  }
  $scope.readURL = function(filename) {
    var trueOrigin = cordova.file.externalRootDirectory + filename;
    return trueOrigin;
  }
  $scope.slideHasChanged = function(index) {
    $scope.slideIndex = index;
    if (index == ($ionicSlideBoxDelegate.count() -1 ) ) {
        $timeout(function(){
            $ionicSlideBoxDelegate.slide(0);
        },3000);
    }
  };
  function Download(resources){
    $ionicPlatform.ready(function() {
        var promises = [];
        resources.forEach(function(i) {
          var filename = i.split("/").pop();
          var targetPath = cordova.file.externalRootDirectory + filename;
          promises.push($cordovaFileTransfer.download(i, targetPath, {}, true).then(function(res){
             FileService.storeImage(filename);
          }));
        });

        $q.all(promises).then(function(res) {
          init();
        });
          
    });
  }    
     
})

.factory('FileService', function($q, $cordovaFileTransfer, $cordovaFile,$ionicPlatform, $ionicLoading) {
  var images;
  var IMAGE_STORAGE_KEY = 'slideImageData';
 
  function getImages() {
    var img = window.localStorage.getItem(IMAGE_STORAGE_KEY);
    if (img) {
      images = JSON.parse(img);
    } else {
      images = [];
    }
    return images;
  };
 
  function addImage(img) {
    images.push(img);
    window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
  };
  function saveImage(dataUrl) {
     $q(function(resolve, reject) {
        var filename = dataUrl.split("/").pop();
        var targetPath = cordova.file.externalRootDirectory + filename;
        $cordovaFileTransfer.download(dataUrl, targetPath, {}, true)
          .then(function(info) {
            addImage(filename);
            resolve();
          }, function(e) {
            reject();
          });
    });
  }
  return {
    saveImage:saveImage,
    storeImage: addImage,
    images: getImages
  }
})

.factory('Data',function($http){

var baseUrl = 'http://163.53.192.162/hondaklaten/slider/slider/get_slider';
return {
        slide: function() {
            return $http.get(baseUrl);
        }
    };
})