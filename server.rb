#Overview: Server reads in from the Tokyo Cabinet datastore and puts it into
#          the bus_times.json file for use with javascript. Runs as daemon.
require 'tokyo'
require 'sinatra'
require 'json'

get '/bus_times.json' do
  BusTimes.to_a.inject({}) do |h, stop|
    stop[1].each {|k,v| stop[1][k] = JSON.load(v) unless k == 'fetched_at' }
    h[stop[0]] = stop[1]
    h
  end.to_json
end
  
