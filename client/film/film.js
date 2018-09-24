/* global angular */

var log = {};
var videoPlayer = document.getElementById("videoPlayer");
var isPlayable = false;

var filmApp = angular.module("filmApp", ["ngMaterial"]);

filmApp.config(function($mdThemingProvider) {
	$mdThemingProvider.theme("default")
		.primaryPalette("teal")
		.accentPalette("blue")
		.dark();
});

filmApp.controller("filmController", function ($scope, $mdSidenav, $http, $timeout) {
	$scope.googleId = "743032936512-2l3g58v9nhagm8n8itnr5o6e3fjm7366.apps.googleusercontent.com";
	$scope.albums = [
		{name: "2018 F Huskies", id: "AIL4oi9jOMv-Osuck5DDwPzpBn-VzVdpMGf4U5dmiiLX2zAfviQoRDOQVEqaq4Tvxf37EO2mWA7g" },
		{name: "2018 F Giants", id: "AIL4oi_UFK4eNBQoeT6RQpeV-__r_r5xTujuqSQwb4IwcMhbJ7H5KEmVlrmglGF0_nEBVImxc_k4" },
		{name: "2018 S Irish", id: "AIL4oi8iFFK33hiFJ4naJRtOYPH2FW-8coDsUbJXwx5TXSOnZKDmopCN7CjLU0KcRbYjUKmjJpIM" },
		{name: "2018 S Giants", id: "AIL4oi-Y4idDYykpyXDsYOUOj7Hz3fYWytTioPDYHpGCSyKpG3VQ5a76k_f8HLt5U9pU77G4Lh-E" }
	];
	$scope.token = "";
	$scope.videos = [];
	
	if (window.location.hash.indexOf("access_token") >= 0) {
		$scope.token = window.location.hash
			.split("&")[0]
			.split("=")[1];
	}
	else if ($scope.token.length == 0) {
		window.location.replace("https://accounts.google.com/o/oauth2/v2/auth?client_id=" + $scope.googleId + "&redirect_uri=http://<GT serverUrl >/film&response_type=token&scope=https://www.googleapis.com/auth/photoslibrary.readonly");
	}
	
	log.scope = $scope;
	log.http = $http;
	
	$scope.closeNav = function () {
		$mdSidenav("left").close();
	};
	
	$scope.openNav = function () {
		$mdSidenav("left").open();
	};
	
	$scope.expandDate = function (dateSection) {
		dateSection.isCollapsed = !dateSection.isCollapsed;
	};
	
	$scope.changeAlbum = function () {
		$scope.videoDates = [];
		$scope.loadAlbum($scope.selectedAlbum.id);
	};
	
	$scope.canPlay = function (event) {
		isPlayable = true;
	};
	
	$scope.loadVideo = function (video, isNext, isPrev) {
		$scope.closeNav();
		$scope.isLoading = true;
		
		if (isPlayable) {
			isPlayable = false;
			 videoPlayer.setAttribute("src", "");
		}
		
		$scope.videoDates.forEach(function (section) {
			section.videos.forEach(function (otherVideo, videoIndex) {
				if (otherVideo.isSelected && isPrev) {
					// Select prev video
					video = section.videos[videoIndex - 1];
					otherVideo.isSelected = false;
				}
				else if (otherVideo.isSelected && isNext) {
					// Select next video
					video = section.videos[videoIndex + 1];
					otherVideo.isSelected = false;
				}
				else if (otherVideo.isSelected) {
					otherVideo.isSelected = false;
				}
			});
		});
		
		video.isSelected = true;
		$scope.selectedVideo = video;
		
		$http({
			url: "/film/loadvideo?photourl=" + video.url,
			method: "GET"
		})
		.then(function (response) {
			if (response.error) {
				console.log(response.error);
				return;
			}
			
			videoPlayer.setAttribute("src", response.data.url);
			$scope.isLoading = false;
			
		}, function (response) {
			console.log("error at gen url");
			console.log(response);
		});
	};
	
	$scope.loadAlbum = function (albumId, nextPage) {
		$scope.isLoading = true;
		$scope.rawVideo = [];
		
		$http({
			url:"https://photoslibrary.googleapis.com/v1/mediaItems:search", 
			method: "POST", 
			data: { 
				pageSize: 20,
				pageToken: nextPage,
				albumId: albumId
			},
			headers: {
				Authorization: "Bearer " + $scope.token
			}
		})
		.then(function (response) { 
			if (response.data.mediaItems) {
				$scope.rawVideo = $scope.rawVideo.concat(response.data.mediaItems);
				$scope.videos = $scope.videos.concat(response.data.mediaItems
					.filter(function (item) {
						return item.mimeType == "video/mp4";
					})
					.map(function (item) {
						return {
							id: item.id,
							mime: item.mimeType,
							fileName: item.filename,
							url: item.baseUrl + "=dv",
							thumb: item.baseUrl,
							created: new Date(item.mediaMetadata.creationTime),
							createdDate: new Date(
								(new Date(item.mediaMetadata.creationTime)).getFullYear() + "-" + 
								((new Date(item.mediaMetadata.creationTime)).getMonth() + 1) + "-" + 
								(new Date(item.mediaMetadata.creationTime)).getDate())
						};
					}));
				console.log("loaded: " + response.data.mediaItems.length + ". " + (response.data.nextPageToken ? "More loading" : "Done"));
				
				console.log(albumId);
				if (response.data.nextPageToken) {
					$scope.loadAlbum(albumId, response.data.nextPageToken);
				}
				else {
					$scope.videoDates = d3.nest()
						.key(function (video) { return video.createdDate })
						.entries($scope.videos)
						.map(function (dateGroup) {
							return {
								date: ((new Date(dateGroup.key).getMonth()) + 1) + "/" + 
									(new Date(dateGroup.key)).getDate() + "/" + 
									(new Date(dateGroup.key)).getFullYear(),
								isCollapsed: true,
								videos: dateGroup.values.sort(function (prev, curr) {
									return prev.created - curr.created;
								})
							};
						});
					
					$scope.isLoading = false;
				}
			}
			else {
				console.log(response);
			}
		}, function (response) {
			if (response.data.error && response.data.error.message.indexOf("invalid authentication") >= 0) {
				console.log("invalid auth");
				window.location.replace("/film");
			}
			
			console.log(response);
		});
	};
	
	videoPlayer.oncanplay = $scope.canPlay;
	
	$timeout(function () {
		$scope.openNav();
	});
});

document.body.onkeyup = function (event) {
	var span;
	
	if (event.keyCode === 32 || event.which === 13) { // space
		if (isPlayable) {
			(videoPlayer.paused) ? videoPlayer.play() : videoPlayer.pause();
		}
	}
	else if (event.keyCode === 39 || event.which === 39) { // right
		if (isPlayable) {
			span = (event.ctrlKey) ? 1 : .1;
			
			if (videoPlayer.currentTime + span < videoPlayer.duration) {
				videoPlayer.currentTime += span;
			}
		}
	}
	else if (event.keyCode === 37 || event.which === 37) { // left
		if (isPlayable) {
			span = (event.ctrlKey) ? 1 : (1 / 59.94);
			
			if (videoPlayer.currentTime - span > 0) {
				videoPlayer.currentTime -= span;
			}
			else {
				videoPlayer.currentTime = 0;
			}
		}
	}
	else if (event.keyCode == 78 || event.which == 78) {// n
		angular.element(document.body).scope().loadVideo(null, 1);
	}
	else if (event.keyCode == 80 || event.which == 80) {// p
		angular.element(document.body).scope().loadVideo(null, 0, 1);
	}
	else {
		console.log(event);
	}
};
