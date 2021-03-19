/* global d3 */
/* global teamApp */

teamApp.directive("play", () => ({
	restrict: "E",
	scope: {
		data: "="
	},
	link: (scope, element) => {
		const colors = ["red", "blue", "green", "orange", "black", "purple", "lightblue"]
		
		const svg = d3.select(element[0])
			.append("svg")
			.attr("viewBox", "0 0 400 410")
			.attr("preserveAspectRatio", "none")
			.attr("class", "play");
		
		svg.append("line")
			.attr("x1", "0")
			.attr("y1", "310")
			.attr("x2", "400")
			.attr("y2", "310");
		
		const definitions = svg.append("defs");
		
		definitions.selectAll("markerArrow")
			.data(colors)
			.enter()
			.append("marker")
			.attr("id", color => "arrow-" + color)
			.attr("class", "markerArrow")
			.attr("viewBox", "0 0 10 10")
			.attr("refX", "1")
			.attr("refY", "5")
			.attr("markerWidth", "6")
			.attr("markerHeight", "6")
			.attr("orient", "auto-start-reverse")
			.attr("fill", color => color)
			.append("polygon")
			.attr("points", "0 1.5, 10 5, 0 8.5");
		
		definitions.selectAll("markerBlock")
			.data(colors)
			.enter()
			.append("marker")
			.attr("id", color => "block-" + color)
			.attr("class", "markerBlock")
			.attr("viewBox", "0 0 20 20")
			.attr("refX", "1")
			.attr("refY", "5")
			.attr("markerWidth", "20")
			.attr("markerHeight", "20")
			.attr("orient", "auto-start-reverse")
			.attr("fill", color => color)
			.append("rect")
			.attr("x", "0")
			.attr("y", "1")
			.attr("width", "5")
			.attr("height", "20");
		
		scope.$watch("data", (newValue, oldValue) => {
			
			if (scope.data) {
				
				const routes = scope.data.players
					.filter(player => player.route.length > 0)
					.map(player => {
						let route = "";
						
						if (player.routeType === "straight" || player.routeType === "run") {
							route = player.route.map(point => "L" + point.x + "," + point.y).join(" ");
						}
						else if (player.routeType === "curved") {
							route = player.route.map((point, index, routes) => {
								let path = "";
								
								if (index === 0) {
									// First curve should be bezier
									
									if (Math.abs(point.x - player.location.x) > Math.abs(point.y - player.location.y)) {
										path = "C" + player.location.x + "," + point.y + " " + 
											point.x + "," + point.y + " " +
											point.x + "," + point.y + " ";
									}
									else {
										path = "C" + point.x + "," + player.location.y + " " + 
											point.x + "," + point.y + " " +
											point.x + "," + point.y + " ";
									}
								}
								else {
									// Following paths should be S paths
									path = "S" +point.x + "," + routes[index - 1].y + " " + point.x + "," + point.y;
								}
								
								return path;
							}).join(" ");
						}
							
						return {
							color: player.color,
							routeType: player.routeType,
							cap: player.routeAction === "block" ? "block" : "arrow",
							path: "M" + player.location.x + "," + player.location.y + " " + route
						};
					});
				
				svg.selectAll(".player")
					.data(scope.data.players)
					.enter()
					.append("circle")
					.attr("r", "8")
					.attr("cx", player => player.location.x)
					.attr("cy", player => player.location.y)
					.attr("fill", player => player.color)
					.attr("stroke", player => player.color)
					.attr("class", "player");
				
				svg.selectAll(".route")
					.data(routes)
					.enter()
					.append("path")
					.attr("class", route => "route" + (route.routeType === "run" ? " run" : ""))
					.attr("marker-end", route => "url(#" + route.cap + "-" + route.color + ")")
					.attr("stroke", route => route.color)
					.attr("d", route => route.path);
				
			}
		});
	}
}));

teamApp.directive("playmaker", function ($interval) {
	
	function getArrow(player) {
		var prevPoint = player.route.length - 1,
			distance = 0;
		while (distance < 25 && prevPoint > 0) {
			prevPoint -= 1;
			distance = Math.abs(player.route[player.route.length - 1].x - player.route[prevPoint].x) + Math.abs(player.route[player.route.length - 1].y - player.route[prevPoint].y);
		}
		
		// Get the angle based on where the point was 4 points ago and the last point
		var px = player.route[prevPoint].x,
			py = player.route[prevPoint].y,
			cx = player.route[player.route.length - 1].x,
			cy = player.route[player.route.length - 1].y;
		
		// Get the difference between the points
		var dx = px - cx, 
			dy = py - cy;
		
		// Get the angle by using the atan (have to convert from radians to degrees)
		var theta = Math.atan2(dy, dx) * (180 / Math.PI);
		
		// Set 1 angle 35 degrees away from the calculated angle
		var angle1 = theta + 35, 
			angle2 = theta - 35, 
			radius = 10;
		
		// Get the end point for each angle using cos for the X and sin for the Y
		var handle1X = cx + radius * Math.cos(angle1 * (Math.PI / 180)),
			handle1Y = cy + radius * Math.sin(angle1 * (Math.PI / 180)),
			handle2X = cx + radius * Math.cos(angle2 * (Math.PI / 180)),
			handle2Y = cy + radius * Math.sin(angle2 * (Math.PI / 180));
		
		return {
			start: { x: cx, y: cy },
			handle1: { x: handle1X, y: handle1Y },
			handle2: { x: handle2X, y: handle2Y }
		};
	}
	
	return {
		restrict: "E",
		scope: {
			controller: "=",
			playdata: "="
		},
		link: function (scope, element) {
			var outer = {};
			
			scope.objects = {};
			scope.converter = { x: d3.scaleLinear(), y: d3.scaleLinear() };
			scope.controller = {
				lineMode: "move"
			};
			
			element.ready(function () {
				outer.width = element[0].offsetWidth > 800 ? 800 : element[0].offsetWidth;
				outer.height = element[0].offsetWidth > 800 ? 533 : (element[0].offsetWidth * 2) / 3;
				
				// outer.width = 800;
				// outer.height = 533;
				
				scope.converter.x.range([0, outer.width]);
				scope.converter.x.domain([0, 500]);
				// scope.converter.x.domain([0, outer.width]);
				
				scope.converter.y.range([0, outer.height]);
				scope.converter.y.domain([0, 333]);
				// scope.converter.y.domain([0, outer.height]);
				
				scope.objects.svg = d3.select(element[0])
					.append("svg")
					.attr("preserveAspectRatio", "none")
					.attr("width", outer.width)
					.attr("height", outer.height)
					.on("click", function () {
						if (scope.controller.lineMode == "straight" && scope.playdata.players.some(function (player) { return player.selected })) {
							var player = scope.playdata.players.find(function (player) { return player.selected });
							
							if (!player.route || player.route.length == 0) {
								player.route = [{ x: Math.floor(player.location.x), y: Math.floor(player.location.y) }];
							}
							
							var snapWidth = 20,
								newX = Math.floor(scope.converter.x.invert(d3.event.offsetX)),
								newY = Math.floor(scope.converter.y.invert(d3.event.offsetY));
							
							if (newX < player.route[player.route.length - 1].x + snapWidth && newX > player.route[player.route.length - 1].x - snapWidth) {
								newX = player.route[player.route.length - 1].x;
							}
							
							if (newY < player.route[player.route.length - 1].y + snapWidth && newY > player.route[player.route.length - 1].y - snapWidth) {
								newY = player.route[player.route.length - 1].y;
							}
							
							player.route.push({x: newX, y: newY});
							
							var route = d3.selectAll("g[start = '" + player.location.x + "," + player.location.y + "']");
							
							if (route.empty()) {
								// Create the route in a group object to support the arrow paths
								route = scope.objects.routes.append("g")
									.attr("start", player.location.x + "," + player.location.y)
									.attr("class", "playerPath");
							}
							
							// Remove previous route and arrows - full route will be redrawn
							route.selectAll("path").remove();
							
							route.append("path")
								.attr("d", "M " + player.route.map(function (path) { return scope.converter.x(path.x) + "," + scope.converter.y(path.y) }).join(" "));
							
						}
					});
				
				scope.objects.background = scope.objects.svg.append("image")
					.attr("href", "/team/media/field.png")
					.attr("width", outer.width)
					.attr("height", outer.height);
				
				// Add Scrimage line
				if (!scope.playdata.scrimageLine) {
					scope.playdata.scrimageLine = Math.floor(scope.converter.y.domain()[1] * .7);
				}
				
				scope.objects.scrimageLine = scope.objects.svg.append("rect")
					.attr("class", "scrimage")
					.attr("x", 0)
					.attr("width", outer.width)
					.attr("height", 5)
					.attr("y", scope.converter.y(scope.playdata.scrimageLine))
					.call(d3.drag()
						.on("start", function () {
							var lineRect = d3.select(this);
							
							if (lineRect && lineRect.attr("height") == 5) {
								lineRect.attr("y", +lineRect.attr("y") - 1);
								lineRect.attr("height", 7);
							}
							
						})
						.on("drag", function () {
							var lineRect = d3.select(this);
							
							if (lineRect) {
								lineRect.attr("y", d3.event.y);
							}
							
						})
						.on("end", function () {
							var lineRect = d3.select(this);
							
							if (lineRect && lineRect.attr("height") == 7) {
								lineRect.attr("y", +lineRect.attr("y") + 1);
								lineRect.attr("height", 5);
								
								scope.playdata.scrimageLine = Math.floor(scope.converter.y.invert(d3.event.y));
							}
						})
					);
				
				scope.objects.routes = scope.objects.svg.append("g");
				
				scope.controller.refresh = function () {
					var newPlayers = scope.objects.svg.selectAll(".player")
						.data(scope.playdata.players)
						.enter()
						.each(function (player) { 
							if (!player.location) { 
								player.location = {
									x: scope.converter.x.domain()[1] * .5,
									y: player.type == "offense" ? scope.converter.y.domain()[1] * .9 : scope.converter.y.domain()[1] * .1
								};
							}
						})
						.append("g")
						.attr("transform", function (player) { return "translate(" + scope.converter.x(player.location.x) + "," + scope.converter.y(player.location.y) + ")" })
						.attr("class", function (player) { return player.type == "offense" ? "player playerOffense" : "player playerDefense" })
						.on("click", function (player) {
							var routeBox, arrow;
							
							if (player.selected) {
								scope.playdata.players.forEach(function (player) { player.selected = false; });
								
								d3.selectAll(".player")
									.attr("class", function (player) { return player.type == "offense" ? "player playerOffense" : "player playerDefense" });
								
								// Draw the arrows - exclude short lines
								if (player.route && player.route.length > 0) {
									routeBox = d3.select("g[start = '" + player.location.x + "," + player.location.y + "']");
									arrow = getArrow(player);
										
									// Add the 2 handles
									routeBox.append("path")
										.attr("class", "playerPath")
										.attr("d", "M " + scope.converter.x(arrow.start.x) + "," + scope.converter.y(arrow.start.y) + " " + scope.converter.x(arrow.handle1.x) + "," + scope.converter.y(arrow.handle1.y));
									routeBox.append("path")
										.attr("class", "playerPath")
										.attr("d", "M " + scope.converter.x(arrow.start.x) + "," + scope.converter.y(arrow.start.y) + " " + scope.converter.x(arrow.handle2.x) + "," + scope.converter.y(arrow.handle2.y));
								}
								
							}
							else {
								// Unselect all players
								var selectedPlayer = scope.playdata.players.find(function (player) { return player.selected; });
								
								if (selectedPlayer) {
									selectedPlayer.selected = false;
									
									// Remove the highlight
									d3.selectAll(".player")
										.attr("class", function (player) { return player.type == "offense" ? "player playerOffense" : "player playerDefense" });
									
									// Add arrows
									routeBox = d3.selectAll("g[start = '" + selectedPlayer.location.x + "," + selectedPlayer.location.y + "']");
									if (player.route && player.route.length > 0 && routeBox.selectAll("path").size() == 1) {
										arrow = getArrow(selectedPlayer);
										
										routeBox.append("path")
											.attr("class", "playerPath")
											.attr("d", "M " + scope.converter.x(arrow.start.x) + "," + scope.converter.y(arrow.start.y) + " " + scope.converter.x(arrow.handle1.x) + "," + scope.converter.y(arrow.handle1.y));
										
										routeBox.append("path")
											.attr("class", "playerPath")
											.attr("d", "M " + scope.converter.x(arrow.start.x) + "," + scope.converter.y(arrow.start.y) + " " + scope.converter.x(arrow.handle2.x) + "," + scope.converter.y(arrow.handle2.y));
									}
								}
								
								// Select only selected player
								player.selected = true;
								d3.select(this)
									.attr("class", function (player) { return player.type == "offense" ? "player playerOffense playerSelected" : "player playerDefense playerSelected" });
								
								// Remove the existing path
								if (player.route) {
									d3.select("g[start = '" + player.location.x + "," + player.location.y + "']")
										.remove();
									player.route = [];
								}
								
							}
							
							d3.event.stopPropagation();
						})
						.call(d3.drag()
							.on("start", function (player) {
								if (player.selected) {
									if (scope.controller.lineMode == "move") {
										if (!player.dragging) {
											player.dragging = true;
											
											// Fitler for and remove the path for the player
											if (player.route) {
												d3.select("g[start = '" + player.location.x + "," + player.location.y + "']")
													.remove();
											}
											
											// Select the player
											var playerBox = d3.selectAll(".player.playerSelected");
											if (!playerBox.empty()) {
												playerBox.attr("transform", "translate(" + scope.converter.x(player.location.x) + "," + scope.converter.y(player.location.y) + ") scale(4)");
											}
										}
									}
									else if (scope.controller.lineMode == "curved") {
										player.newPath = true;
									}
								}
							})
							.on("drag", function (player) {
								if (player.selected) {
									
									if (scope.controller.lineMode == "move") {
										var snapWidth = 25,
											newX = Math.floor(scope.converter.x.invert(d3.event.x)),
											newY = Math.floor(scope.converter.y.invert(d3.event.y));
										
										// Find if there are close players
										var closePlayers = scope.playdata.players.filter(function (filterPlayer) { 
											return (player.location.x + "," + player.location.y) != (filterPlayer.location.x + "," + filterPlayer.location.y)
												&& (
													(newX + 10 < filterPlayer.location.x + snapWidth && newX - 10 > filterPlayer.location.x - snapWidth)
													|| (newY + 10 < filterPlayer.location.y + snapWidth && newY - 10 > filterPlayer.location.y - snapWidth)
												);
										});
										
										if (closePlayers.length > 0) {
											// If the X is within snap range then change the position
											if (newX < closePlayers[0].location.x + snapWidth && newX > closePlayers[0].location.x - snapWidth) {
												newX = closePlayers[0].location.x;
											}
											
											// If the Y is within snap range then change the position
											if (newY < closePlayers[0].location.y + snapWidth && newY > closePlayers[0].location.y - snapWidth) {
												newY = closePlayers[0].location.y;
											}
										}
										
										player.location.x = newX;
										player.location.y = newY;
										
										d3.select(this)
											.attr("transform", "translate(" + scope.converter.x(player.location.x) + "," + scope.converter.y(player.location.y) + ") scale(4)");
									}
									else if (scope.controller.lineMode == "curved") {
										if (player.newPath) {
											// Set the initial point to the location of the player
											player.route = [{ x: Math.floor(player.location.x), y: Math.floor(player.location.y) }];
											
											player.newPath = false;
										}
										
										// Add the new point
										player.route.push({ x: Math.floor(scope.converter.x.invert(d3.event.x)), y: Math.floor(scope.converter.y.invert(d3.event.y))});
										
										var route = d3.selectAll("g[start = '" + player.location.x + "," + player.location.y + "']");
										
										if (route.empty()) {
											// Create the route in a group object to support the arrow paths
										route = scope.objects.routes.append("g")
											.attr("start", player.location.x + "," + player.location.y)
											.attr("class", "playerPath");
										}
										
										// Remove previous route and arrows - full route will be redrawn
										route.selectAll("path").remove();
										
										route.append("path")
											.attr("d", "M " + player.route.map(function (path) { return scope.converter.x(path.x) + "," + scope.converter.y(path.y) }).join(" "));
									}
									
								}
							})
							.on("end", function (player) {
								if (scope.controller.lineMode == "move") {
									if (player.dragging) {
										player.dragging = false;
										
										// Select the player
										var playerBox = d3.selectAll(".player.playerSelected");
										if (!playerBox.empty()) {
											playerBox.attr("transform", "translate(" + scope.converter.x(player.location.x) + "," + scope.converter.y(player.location.y) + ")");
										}
									}
								}
							})
							
						);
					
					// Add offense circle
					newPlayers.filter(function (player) { return player.type == "offense" })
						.append("circle")
						.attr("r", 10)
						.attr("cx", 0)
						.attr("cy", 0);
					
					// Add defense outer rect (used to select player)
					newPlayers.filter(function (player) { return player.type == "defense" })
						.append("rect")
						.attr("x", -10)
						.attr("y", -10)
						.attr("width", 20)
						.attr("height", 20);
					
					// Add the defesnse X
					newPlayers.filter(function (player) { return player.type == "defense" })
						.append("path")
						.attr("d", "M -10,-10 10,10 M -10,10 10,-10 z");
					
					// Create the route group object
					var newRoutes = scope.objects.routes.selectAll(".playerPath")
						.data(scope.playdata.players.filter(function (player) { return player.route && player.route.length > 0 }))
						.enter()
						.append("g")
						.attr("start", function (player) { return player.location.x + "," + player.location.y })
						.attr("class", "playerPath");
					
					// Add the paths
					newRoutes.append("path")
						.attr("d", function (player) {
							return "M " + player.route.map(function (route) { return scope.converter.x(route.x) + "," + scope.converter.y(route.y) }).join(" ");
						});
					
					// Add first arrow
					newRoutes.append("path")
						.attr("d", function (player) {
							var arrow = getArrow(player);
							
							// return the handle
							return "M " + scope.converter.x(arrow.start.x) + "," + scope.converter.y(arrow.start.y) + " " + scope.converter.x(arrow.handle1.x) + "," + scope.converter.y(arrow.handle1.y);
						});
					
					// Add second arrow
					newRoutes.append("path")
						.attr("d", function (player) {
							var arrow = getArrow(player);
							
							// return the handle
							return "M " + scope.converter.x(arrow.start.x) + "," + scope.converter.y(arrow.start.y) + " " + scope.converter.x(arrow.handle2.x) + "," + scope.converter.y(arrow.handle2.y);
						});
				};
				
				
				scope.controller.refresh();
			});
			
		}
	};
});
