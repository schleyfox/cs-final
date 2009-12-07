var Direction = {
  init: function() {
    $.getJSON("localhost:4567/bus_routes.json",
        function(data) {
          this.setBusRoutes(data);
        });
    this.direction_requests = {}
    return this;
  },

  setBusRoutes: function(routes) {
    this.bus_routes = routes;
    this.getDirections();
  },

  getDirections: function() {
    if(this.start_location && this.end_location && this.bus_routes) {
      start_location = this.start_location
      end_location = this.end_location
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

  findNearestRoute: function(start, end) {},

  directionsCallback: function(name) {
    return function(result, directions_status) {
      if(directions_status != OK) {
        alert("Google Maps Directions Service could not find a route");
        return false;
      }
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
    this.direction_requests[name] = null;
    new DirectionsService().route(new DirectionsRequest({
      destination: end,
      origin: start,
      provideTripAlternatives: false,
      travelMode: WALKING}),
      directionsCallback(name));
  }

  getDrivingDirections: function(name, path) {
    start = path[0];
    end = path[path.size-1];
    waypoints = jQuery.map(slice(path, 1, path.size-2), 
      function(point) {
        return new DirectionsWaypoint({location: point, stopover: false});
      });

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


