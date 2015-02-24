$("#scroll").click(function() {
	/*
	var psconsole = $('#one');
    if(psconsole.length)
       psconsole.scrollTop(psconsole[0].scrollHeight - psconsole.height());
	   
	 */
	 $("#myDiv").attr({ scrollTop: $("#myDiv").attr("scrollHeight") });
	console.log("Gaur");
});