function editGameCtl(game, $scope, $mdDialog, $http, $mdToast) {
	log.editGame = $scope;

	$scope.game = game;
	
	if ($scope.game.awayTeam.isWinner) {
		$scope.winningTeamId = $scope.game.awayTeam.id;
	}
	else if ($scope.game.homeTeam.isWinner) {
		$scope.winningTeamId = $scope.game.homeTeam.id;
	}
	
	$scope.original = {
		awayTeam: {
			isWinner: game.awayTeam.isWinner,
			score: game.awayTeam.score
		},
		homeTeam: {
			isWinner: game.homeTeam.isWinner,
			score: game.homeTeam.score
		}
	};
	
	$scope.cancel = function () {
		$scope.game.awayTeam.isWinner = $scope.original.awayTeam.isWinner;
		$scope.game.awayTeam.score = $scope.original.awayTeam.score;
		$scope.game.homeTeam.isWinner = $scope.original.homeTeam.isWinner;
		$scope.game.homeTeam.score = $scope.original.homeTeam.score;
		
		$mdDialog.cancel();
	};
	
	$scope.scoreChange = function () {
		if ($scope.game.awayTeam.score && $scope.game.homeTeam.score) {
			$scope.winningTeamId = $scope.game.awayTeam.score > $scope.game.homeTeam.score ? $scope.game.awayTeam.id : $scope.game.homeTeam.id;
		}
	};
	
	$scope.save = function () {
		$scope.isLoading = true;
		
		if ($scope.winningTeamId) {
			$scope.game.awayTeam.isWinner = $scope.winningTeamId == $scope.game.awayTeam.id;
			$scope.game.homeTeam.isWinner = $scope.winningTeamId == $scope.game.homeTeam.id;
		}
		
		$http({url: "/data/game", method: "POST", data: {game: $scope.game}}).then(function (response) {
			$mdDialog.hide($scope.game);
		}, function (error) {
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error saving the game")
					.position("bottom left")
					.hideDelay(3000)
			);
			
			console.log(error);
			$scope.isLoading = false;
		});
	};
}