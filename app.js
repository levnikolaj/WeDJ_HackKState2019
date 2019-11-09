$(function) {
  $("form").on("submit", function(e){
    e.preventDefault();

    var request = gapi.client.youtube.search.list ({
      part: "snippet", type: "video", q: encodeURIComponent($("#search").val()).replace(/%20/g, "+"),
      maxResults: 3, order: "viewCount", publishedAfter: "2015-01-01T00:00:00Z"
    });
    request.execute(function(response)){
      var results = response.result;
      $.each(results.items, function(index, item){
        $.get("tpl/item.html", function(data){
          $("#results").append(search(data, [{"title":item.snippet.title, "videoid": item.id.videoId}]));
        });
      });
      resetVideoHeight();
    });
  });
  $(window).on("resize", resetVideoHeight);
});

function init() {
  gapi.client.setApiKey("AIzaSyDhfkcrO7oHPIe_cjY2PXaPAQ6IOrCo7o4");
  gapi.client.load("youtube","v3", function(){
    //yt api is read
  });
}//hello

function search(template, data) {
	// initiate the result to the basic template
	res = template;
	// for each data key, replace the content of the brackets with the data
	for(var i = 0; i < data.length; i++) {
		res = res.replace(/\{\{(.*?)\}\}/g, function(match, j) { // some magic regex
			return data[i][j];
		})
	}
	return res;
}
