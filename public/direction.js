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
    this.getDirections();
  },
  
  setEndLocation: function(endCoord)
  {
    //Requires: Coordinates in the form [float,float]
    //Modifies: this.end_location
    //Effects: Sets this.end_location
    this.end_location = endCoord;
    this.getDirections();
  },

  getStartLocation: function()
  {
    return this.start_location;
  },

  getEndLocation: function()
  {
    return this.end_location;
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
      s = this
      $.getJSON("/bus_times.json",
      function(times) {
        this.direction_requests = {}

        var tmp_ary = s.findNearestRoute(start_location, end_location);
        var route = tmp_ary[0]; var start_index = tmp_ary[1]; var finish_index = tmp_ary[2];

        alert(route.name);

        s.getWalkingDirections('just_walking',
          start_location, end_location);

        s.getWalkingDirections('walk_to_start',
          start_location, route[start_index][1]);

        s.getWalkingDirections('walk_to_end',
          route[finish_index][1], end_location);

        s.getDrivingDirections('bus_driving',
          route.slice(start_index, finish_index));
      });
    }
  },

  distance: function(a, b) {
    return Math.sqrt(Math.pow((b[0]-a[0]),2)+Math.pow((b[1]-a[1]),2));
  },

  findNearestRoute: function(start, end) {
    //REQUIRES:
    //EFFECTS:
    //MODIFIES:
    
    var distances = [];

    for(var i in this.bus_routes) {
      var route = this.bus_routes[i];
    
      var start_min = [-1,999999];
      for(var j in route) {
        if(j != 'name'){
        var start_dist = this.distance(start, route[j][1]);
        if(start_dist < start_min[1]) {
          start_min = [j, start_dist];
        }
        }
      }
    
      var end_min = [-1,999999];
      //end has to occur on the line after start
      route_after_start = route.slice(start_min[0])
      for(var j in route_after_start) {
        if(j != 'name'){
        var end_dist = this.distance(end, route[j][1]);
        if(end_dist < end_min[1]) {
          end_min = [j, end_dist];
        }
        }
      }
    
      distances.push([start_min[1] + end_min[1], route, start_min[0], end_min[0]]);
    }
    
    var dist_min = [999999];
    for(var i in distances) {
      var distance = distances[i];
      if(distance[0] < dist_min[0]) {
        dist_min = distance;
      }
    }
    
    return dist_min.slice(1)
  },

  getDirectionRequests: function(name)
  {
      return this.direction_requests[name];
  },

  directionsCallback: function(name) {
    //Requires: Requires name to be not null
    //Effects: Checks to see if all the information in direction_requests
    //         is properly populated
    //Error handling to see if data user provided was accurate and browser doesn't freeze up
    s = this
    return function(result, directions_status) {
      if(directions_status != google.maps.DirectionsStatus.OK) {
        alert(directions_status);
        alert("Google Maps Directions Service could not find a route");
        return false;
      }
      //Check all the output received by Google Maps to make sure it is defined
      //If there is a key not defined, then we must wait
      s.direction_requests[name] = result;
      for(var key in s.direction_requests) {
        if(!s.direction_requests[key]) {
          return false;
        }
      }
      s.displayTimes();
    };
  },

  getWalkingDirections: function(name, start, end) {
    //Requires: Name, start, and end all to be non-null
    //Effects: Sends Google Maps API a request to get wwalking
    //         directions
    //send direction request to Google
    this.direction_requests[name] = null;
    var dir = new google.maps.DirectionsService();
    dir.route({
      destination: new google.maps.LatLng(end[0],end[1]),
      origin: new google.maps.LatLng(start[0],start[1]),
      provideTripAlternatives: false,
      travelMode: google.maps.DirectionsTravelMode.WALKING},
      this.directionsCallback(name));
  },

  getDrivingDirections: function(name, path) {
    //Requires: Name and path to be non-null
    //Effects: Sends Google Maps API a request for driving directions
    var start = path[0][1];
    var end = path[path.length-1][1];
    //waypoints is how the bus stops will be established
    //waypoints must be <25, or <23 with a start and end point (Google 
    //restriction)
    //Note: A waypoint is considered a stop point the route must go through
    //      when using Google Maps
    /*var waypoints = jQuery.map(path.slice(1, path.length-2), 
      function(point) {
        return {location: new google.maps.LatLng(point[1][0],point[1][1]), stopover: false};
      });

    var real_waypoints = [];
    for(var i in waypoints) {
      if(i%2 == 0) {
        real_waypoints.push(waypoints[i]);
      }
    }*/

    //send direction request to Google
    this.direction_requests[name] = null;
    var dir = new google.maps.DirectionsService();
    dir.route({
      destination: new google.maps.LatLng(end[1],end[2]),
      origin: new google.maps.LatLng(start[1],start[2]),
      provideTripAlternatives: false,
      travelMode: google.maps.DirectionsTravelMode.DRIVING
      /*,
      waypoints: real_waypoints*/},
      this.directionsCallback(name));
  },

  displayTimes: function() {
    alert(this.direction_requests.just_walking.trips[0].routes[0].duration.text);
    alert(this.direction_requests.walk_to_start.trips[0].routes[0].duration.value + 
          this.direction_requests.bus_driving.trips[0].routes[0].duration.value +
          this.direction_requests.walk_to_end.trips[0].routes[0].duration.value);
  }
}

