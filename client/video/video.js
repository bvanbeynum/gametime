/* global angular */

const log = {},
	videoApp = angular.module("videoApp", []),
	videoPlayer = document.getElementById("videoPlayer");

let isPlayable = false;

videoApp.controller("videoCtl", ($scope, $http) => {
	
	log.scope = $scope;
	log.http = $http;
	
	$scope.toast = { text: "", active: false, type: "info", messages: 0 };
	$scope.isConverting = false;
	
	$http({url: "/video/api/load" }).then(
		response => {
			$scope.files = response.data.files;
		}
		, error => {
			$scope.showMessage("warn", "error: " + error.message);
		});
	
	$scope.loadVideo = file => {
		$scope.video = file;
		videoPlayer.setAttribute("src", "/video/files/" + file);
	};
	
	$scope.cropChange = changeType => {
		if (changeType === "width") {
			const oldValue = $scope.cropWidth,
				newValue = $scope.cropWidthTemp;
			
			$scope.cropWidth = $scope.cropWidthTemp;
			$scope.cropHeightTemp = $scope.cropHeight = $scope.cropHeight + Math.round(((newValue - oldValue) / oldValue) * $scope.cropHeight);
		}
		else {
			const oldValue = $scope.cropHeight,
				newValue = $scope.cropHeightTemp;
			
			$scope.cropHeight = $scope.cropHeightTemp;
			$scope.cropWidthTemp = $scope.cropWidth = $scope.cropWidth + Math.round(((newValue - oldValue) / oldValue) * $scope.cropWidth);
		}
	};
	
	videoPlayer.onloadedmetadata  = event => {
		$scope.videoStart = 0;
		$scope.videoEnd = videoPlayer.duration;
		
		$scope.videoWidth = videoPlayer.videoWidth;
		$scope.videoHeight = videoPlayer.videoHeight;
		
		$scope.cropTop = Math.floor($scope.videoHeight * .1);
		$scope.cropLeft = Math.floor($scope.videoWidth * .1);
		$scope.cropHeightTemp = $scope.cropHeight = ($scope.videoHeight - Math.floor($scope.videoHeight * .1)) - $scope.cropTop;
		$scope.cropWidthTemp = $scope.cropWidth = ($scope.videoWidth - Math.floor($scope.videoWidth * .1)) - $scope.cropLeft;
		$scope.outputWidth = 180;
		$scope.frameRate = 10;
		
		isPlayable = true;
		$scope.isPlayable = isPlayable;
		$scope.$apply();
	};
	
	videoPlayer.ontimeupdate = event => {
		$scope.currentTime = videoPlayer.currentTime;
		$scope.$apply();
	};
	
	$scope.convertVideo = () => {
		let param = [];
		
		if ($scope.videoStart > 0) {
			param.push("start=" + parseInt($scope.videoStart, 10));
		}
		if ($scope.videoEnd > 0 && $scope.videoEnd > $scope.videoStart && $scope.videoEnd < videoPlayer.duration) {
			param.push("duration=" + (parseInt($scope.videoEnd, 10) - parseInt($scope.videoStart, 10)));
		}
		if ($scope.cropTop > 0 && $scope.cropLeft > 0 && $scope.cropWidth > 0 && $scope.cropHeight > 0) {
			param.push(
				"top=" + parseInt($scope.cropTop, 10) +
				"&left=" + parseInt($scope.cropLeft, 10) +
				"&width=" + parseInt($scope.cropWidth, 10) +
				"&height=" + parseInt($scope.cropHeight, 10)
			);
		}
		if ($scope.outputWidth > 0) {
			param.push("outputwidth=" + parseInt($scope.outputWidth, 10));
		}
		if ($scope.frameRate > 0) {
			param.push("framerate=" + parseInt($scope.frameRate, 10));
		}
		
		$scope.isConverting = true;
		
		$http({ url: "/video/api/convert?file=" + $scope.video + "&" + param.join("&") }).then(
			response => {
				$scope.isConverting = false;
				$scope.gifImage = "/video/files/" + response.data.fileName;
				$scope.outputSize = Math.round(response.data.size * 100) / 100;
				$scope.showMessage("info", "Conversion Complete");
			},
			error => {
				console.warn(error);
				$scope.showMessage("warn", "error: " + error.message);
				$scope.isConverting = false;
			});
	};
	
	$scope.showMessage = (type, message) => {
		if ($scope.toast.active) {
			$scope.toast.text = message + "<br>" + $scope.toast.text;
		}
		else {
			$scope.toast.text = message;
		}
		
		$scope.toast.active = true;
		$scope.toast.type = type;
		
		setTimeout(() => {
			var lines = $scope.toast.text.split("<br>");
			lines.pop();
			$scope.toast.text = lines.join("<br>");
			
			if ($scope.toast.text.length == 0) {
				$scope.toast.active = false;
				$scope.toast.type = "info";
			}
			
			$scope.$apply();
		}, 4000);
	};
	
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
		// console.log(event);
	}
};
