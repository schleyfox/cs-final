//Overview: The Direction object handles the communication between the
//          front-end and the back-end. It loads bus_times and bus_routes
//          when the user makes a request to the server. It does most of
//          the handling in sending requests to the Google Maps API.
var Direction = {
  init: function() {
    //Requires: true
    //Modifies: this.direction_requests
    //Effects: Initializes Direction object and sets
    //         busRoutes
    $.getJSON("localhost:4567/bus_routes.json",
        //setBusRoutes to data
        function(data) {
          this.setBusRoutes(data);
        });
    this.direction_requests = {}
    return this;
  },

  setBusRoutes: function(routes) {
    //Requires: routes to be initialized and properly populated
    //          with data from bus_routes.json
    //Modifies: bus_routes
    //Effects: Initializes bus_routes and attemps to getDirections
    
    //Add name property to bus stop arrays
    route_list = [];
    for(route_name in routes) {
      route = routes[route_name];
      route.name = route_name;
      route_list.append(route);
    }

    this.bus_routes = route_list;
    this.getDirections();
  },

  getDirections: function() {
    //Requires: true
    //Effects: Loads in bus_times and
    //Check to see if start_location, end_location, and bus_routes were
    //initialized
    if(this.start_location && this.end_location && this.bus_routes) {
      start_location = this.start_location
      end_location = this.end_location
      //Get the latest bus_times to ensure the data we provide is accurate
      //Note: bus_times is updated every minute using cron
      $.getJSON("localhost:4567/bus_times.json",
      function(times) {
        this.direction_requests = {}

        route, start_index, finish_index =
          this.findNearestRoute(start_location, end_location);
      
        this.getWalkingDirections('just_walking',
          start_location, end_location);

        this.getWalkingDirections('walk_to_start',
          start_location, route[start_index][1]);

        this.getWalkingDirections('walk_to_end',
          route[finish_index][1], end_location);

        this.getDrivingDirections('bus_driving',
          slice(route, start_index, finish_index));
      });
    }
  },

  findNearestRoute: function(start, end) {
	//REQUIRES:
	//EFFECTS:
	//MODIFIES:
 
	//Every kind of route,, to hold the distances for each route (Distances is the shortest total from starting point and ending point to the nearest stops on the line)
	TotalDistances['NL'] = 0;
	TotalDistances['CS'] = 0;
	TotalDistances['G'] = 0;
	TotalDistances['UL'] = 0;
	TotalDistances['CGS'] = 0;
      $.getJSON("localhost:4567/bus_routes_with_geo.json",
        //Go Through every object in the Json.
        function(data) {
          for(route_type in data)
		  {
			TStartD, TEndD = 100.0;
			for(stop_num in data[route_type])
			{
				//Find the distances for the Stop on this line. If it is smaller, make its distance the smallest distance for the line. Uses the Distance Formula.
				//SquareRoot( BusLat - StatrtLat)^2 + (BusLong - StartLong)^2)
				StartDistance = Math.sqrt((data[route_type][stop_num][0] - start[0])(data[route_type][stop_num][0] - start[0]) + (data[route_type][stop_num][1] - start[1])(data[route_type][stop_num][1] - start[1]))
				EndDistance = Math.sqrt((data[route_type][stop_num][0] - end[0])(data[route_type][stop_num][0] - end[0]) + (data[route_type][stop_num][1] - end[1])(data[route_type][stop_num][1] - end[1]))
				if(StartDistance < TStartD) {TStartD = StartDistance;}
				if(EndDistance < TEndD) {TEndD = EndDistance;}
			}
			//Store the final smallest disances for this Line
			TotalDistances[route_type] = TStartD + TEndD;
		  }
		  TempDistance = 100.0;
		  var FinalRoute;
		  //Finally, find out which route had the shortest distance.
		  for(route_type in TotalDistances)
		  {
			if(TotalDistances[route_type] < TempDistance) {FinalRoute = route_type;}
		  }
		  //FinalRoute is the best route to take. I don't know what you want this function to return though.
		});
  },

  directionsCallback: function(name) {
    //Requires: Requires name to be not null
    //Effects: Checks to see if all the information in direction_requests
    //         is properly populated
    //Error handling to see if data user provided was accurate and browser doesn't freeze up
    return function(result, directions_status) {
      if(directions_status != OK) {
        alert("Google Maps Directions Service could not find a route");
        return false;
      }
      //Check all the output received by Google Maps to make sure it is defined
      //If there is a key not defined, then we must wait
      this.direction_requests[name] = result.trips[0];
      for(var key in this.direction_requests) {
        if(!this.direction_requests[key]) {
          return false;
        }
      }
      displayTimes();
    };
  }

  getWalkingDirections: function(name, start, end) {
    //Requires: Name, start, and end all to be non-null
    //Effects: Sends Google Maps API a request to get wwalking
    //         directions
    //send direction request to Google
    this.direction_requests[name] = null;
    new DirectionsService().route(new DirectionsRequest({
      destination: end,
      origin: start,
      provideTripAlternatives: false,
      travelMode: WALKING}),
      directionsCallback(name));
  }

  getDrivingDirections: function(name, path) {
    //Requires: Name and path to be non-null
    //Effects: Sends Google Maps API a request for driving directions
    start = path[0];
    end = path[path.size-1];
    //waypoints is how the bus stops will be established
    //waypoints must be <25, or <23 with a start and end point (Google 
    //restriction)
    //Note: A waypoint is considered a stop point the route must go through
    //      when using Google Maps
    waypoints = jQuery.map(slice(path, 1, path.size-2), 
      function(point) {
        return new DirectionsWaypoint({location: point, stopover: false});
      });

    //send direction request to Google
    this.direction_requests[name] = null;
    new DirectionsService().route(new DirectionsRequest({
      destination: end,
      origin: start,
      provideTripAlternatives: false,
      travelMode: DRIVING,
      waypoints: waypoints}),
      directionsCallback(name));
  }
}


