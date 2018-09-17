/* global angular */

var emailerApp = angular.module("emailerApp", ["ngMaterial"]);

var log = {};

emailerApp.config(function($mdThemingProvider) {
	$mdThemingProvider.theme("default")
		.primaryPalette("teal")
		.accentPalette("blue");
});

emailerApp.controller("emailerController", function ($scope, $http, $mdToast, $mdDialog) {
	log.scope = $scope;
	log.http = $http;
	
	$scope.isLoading = true;
	
	$http({ url: "/emailer/load" })
	.then(function (response) {
		$scope.templates = response.data.emails;
		$scope.emailGroups = response.data.emailGroups;
		
		$scope.isLoading = false;
	}, function (response) {
		$mdToast.show(
			$mdToast.simple()
				.textContent("There was an error loading")
				.position("bottom left")
				.hideDelay(3000)
		);
		
		console.log(response);
	});
	
	$scope.changeTemplate = function () {
		if ($scope.selectedFile) {
			$scope.frameUrl = "/emailer/emails/" + $scope.selectedFile;
		}
	};
	
	$scope.send = function (event) {
		var confirm = $mdDialog.confirm()
			.title("Send Email?")
			.textContent("Are you sure you wish to send the " + $scope.selectedFile + " tempalte to " + $scope.selectedGroup + "?")
			.ariaLabel("Send Email?")
			.targetEvent(event)
			.ok("Send Email")
			.cancel("Cancel");
		
		$mdDialog.show(confirm).then(function() {
			$scope.isLoading = true;
			
			$http({ url : "/emailer/send?file=" + $scope.selectedFile + "&emailGroup=" + $scope.selectedGroup })
				.then(function (response) {
					$mdToast.show(
						$mdToast.simple()
							.textContent("Email sent")
							.position("bottom left")
							.hideDelay(3000)
					);
					
					$scope.selectedFile = null;
					$scope.selectedGroup = null;
					$scope.frameUrl = "";
					$scope.isLoading = false;
				}, function (response) {
					$mdToast.show(
						$mdToast.simple()
							.textContent("There was an error sending email")
							.position("bottom left")
							.hideDelay(3000)
					);
					
					console.log(response);
					$scope.isLoading = false;
				});
		});
	};
});