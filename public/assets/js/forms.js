$(document).ready(function () {
  /*$("#removeUser").submit(function (event) {
    var formData = {
      name: $("#name").val(),
      
    };
	console.log(formData)
    $.ajax({
      type: "POST",
      url: "/deleteuser",
      data: formData,
      dataType: "json",
      encode: true,
    }).done(function (data) {
      console.log(data);
    });

    event.preventDefault();
  });*/
	
	$("#removeUser").click(function(){
		var name = $("#name").val();
		if(name == ""){
			let error = "Please provide the full name of the user you want to remove."
			document.getElementById("ajaxerror").innerHTML = error;
			$("#deleteusererrorajax").show()
		}else{
			let confirming = "Are you sure you want to remove this user?";
			if (confirm(confirming) == true) {
				var formData = {
					name: $("#name").val(),
				};
				$.ajax({
					type: "POST",
					url: "/deleteuser",
					data: formData,
					dataType: "json",
					encode: true,
					}).done(function (data) {
					console.log(data);
				});

				
			} else {
				confirming = "Operation canceled!";
				alert(confirming)
				
			}
		}
		
	});
});