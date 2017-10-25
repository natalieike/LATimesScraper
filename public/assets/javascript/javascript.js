$(".showBtn").click(function(event){
	var id = $(this).attr("data_value");
	var idSelector = "#" + id;
	var btnId = "#showBtn" + id;
	if($(idSelector).attr("class") == "hidden"){
		$(idSelector).attr("class", "show");
		$(btnId).text("Hide Comments");
	}else{
		$(idSelector).attr("class", "hidden");
		$(btnId).text("Show {{commentsLength}} Comments");
	}
});