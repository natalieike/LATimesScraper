$(".showBtn").click(function(event){
	var id = $(this).attr("data_value");
	var idSelector = "#" + id;
	$(idSelector).show();
});