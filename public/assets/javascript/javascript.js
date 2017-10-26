$(".showBtn").click(function(event){
	var id = $(this).attr("data_value");
	var idSelector = "#" + id;
	var btnId = "#showBtn" + id;
	if($(idSelector).attr("class") == "hidden"){
		$(idSelector).attr("class", "show");
		$(btnId).text("Hide Comments");
	}else{
		$(idSelector).attr("class", "hidden");
		$(btnId).text("Show Comments");
	}
});

$(".submitBtn").click(function(event){
	var id = $(this).attr("data_id");
	var queryString = "/comments/" + id;
	var text = "#" + id + "commentText";
	var user = "#" + id + "commentUser";
	if($(text).val == null){
		alert("Please enter a comment before submitting");
	}
	if($(user).val == null){
		alert("Please enter a user name.");
	}
	$.ajax({
    method: "POST",
    url: queryString,
    data: {
      commentText: $(commentText).val(),
      commentUser: $(commentUser).val()
    }
  })
    .done(function(data) {
      console.log(data);
      // Empty the comment form
      $(text).empty();
      $(user).empty();
    });
  });