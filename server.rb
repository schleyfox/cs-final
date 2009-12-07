require 'tokyo'
require 'sinatra'
require 'json'

get '/' do
  #render woody's html
  "hello"
end

get '/bus_times.json' do
  BusTimes.to_a.inject({}) do |h, stop|
    stop[1].each {|k,v| stop[1][k] = JSON.load(v) unless k == 'fetched_at' }
    h[stop[0]] = stop[1]
    h
  end.to_json
end
  
