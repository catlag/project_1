function initialize()
{
var mapProp = {
  center:new google.maps.LatLng(37.7749295,-122.4194155),
  zoom:5,
  mapTypeId:google.maps.MapTypeId.ROADMAP
  };
var map=new google.maps.Map(document.getElementById("googleMap")
  ,mapProp);
}
  
$(window).load(initialize);