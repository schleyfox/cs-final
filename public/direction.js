//Overview: The Direction object handles the communication between the
//          front-end and the back-end. It loads bus_times and bus_routes
//          when the user makes a request to the server. It does most of
//          the handling in sending requests to the Google Maps API.
function Direction() {
    //Requires: true
    //Modifies: this.direction_requests
    //Effects: Initializes Direction object and sets
    //         busRoutes
    s = this;
    $.getJSON("/bus_routes_with_geo.json",
        //setBusRoutes to data
        function(data) {
          s.setBusRoutes(data);
        });
    this.direction_requests = {}
    return this;
}
Direction.prototype = {
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
      route_list.push(route);
    }

    this.bus_routes = route_list;
    this.getDirections();
  },

  setStartLocation: function(startCoord)
  {
    //Requires: Coordinates in the form [float,float]
    //Modifies: this.start_location
    //Effects: Sets this.start_location
    this.start_location = startCoord;
  },
  
  setEndLocation: function(endCoord)
  {
    //Requires: Coordinates in the form [float,float]
    //Modifies: this.end_location
    //Effects: Sets this.end_location
    this.end_location = endCoord;
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
      $.getJSON("/bus_times.json",
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

  distance: function(a, b) {
    return Math.sqrt(pow((b[0]-a[0]),2)+pow((b[1]-a[1]),2));
  },

  findNearestRoute: function(start, end) {
    //REQUIRES:
    //EFFECTS:
    //MODIFIES:
    
    distances = [];
    
    for(i in this.bus_routes) {
      route = this.bus_routes[i];
    
      start_min = [-1,999999];
      for(j in route) {
        start_dist = this.distance(start, route[j][1]);
        if(start_dist < start_min[1]) {
          start_min = [j, start_dist];
        }
      }
    
      end_min = [-1,999999];
      //end has to occur on the line after start
      route_after_start = slice(route, start_min[0], route.size-1)
      for(j in route_after_start) {
        end_dist = this.distance(end, route[j][1]);
        if(end_dist < end_min[1]) {
          end_min = [j, end_dist];
        }
      }
    
      distances.push([start_min[1] + end_min[1], route, start_min[0], end_min[0]]);
    }
    
    dist_min = [999999];
    for(i in distances) {
      distance = distances[i];
      if(distance[0] < dist_min[0]) {
        dist_min = distance;
      }
    }
    
    return slice(dist_min, 1, dist_min.size-1)
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
  },

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
  },

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
  },

  displayTimes: function() {
    alert(this.direction_requests.just_walking.trips[0].routes[0].duration);
    alert(this.direction_requests.walk_to_start.trips[0].routes[0].duration + 
          this.direction_requests.bus_driving.trips[0].routes[0].duration +
          this.direction_requests.walk_to_end.trips[0].routes[0].duration);
  }
}

