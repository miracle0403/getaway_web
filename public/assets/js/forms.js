$(document).ready(function () {
  
	$("#removeUser").click(function(){
		let name =  $("#name").val()
		if(name == ""){
			//get the admin page
			$.get("/admin", function(data, status){
				let error = "Please select the user you want to remove"
				document.getElementById("ajaxerror").innerHTML = error;
				$("#deleteusererrorajax").show()
				window.stop()
			});
		}else{
			let confirming = "Are you sure you want to remove this user?";
			if (confirm(confirming) == false){
				confirming = "Operation canceled!";
				console.log("stop")
				alert(confirming)
				return false
				
			}else{
				$.post("/deleteuser", function(data, status){
					
				});
			}
		}
		/*
		let error = "User has been removed successfully!"
					console.log("true")
					document.getElementById("ajaxsuccess").innerHTML = error;
					$("#deleteusersuccessajax").show()
					//return false
		
		if (confirm(confirming) == ) {
				console.log("continue")
				$.post("/deleteuser", function(data, status){
					$.get("/admin", function(data, status){
						let error = "User has been removed successfully!"
						document.getElementById("ajaxsuccess").innerHTML = error;
						$("#deleteusersuccessajax").show()
						window.stop()
					});
				});
			} else {
				console.log("stop")
				$.get("/admin", function(data, status){
					confirming = "Operation canceled!";
					window.stop()
					alert(confirming)	
					$("#deleteusererrorajax").hide()
					$("#deleteusersuccessajax").hide()
				});		
			}
		
		$.post("/deleteuser", function(data, status){
			  alert(status);
		});
		let confirming = "Are you sure you want to remove this user?";
		if (confirm(confirming) == true) {
			$.post("/deleteuser", function(data, status){
				  alert("Data: " + data + "\nStatus: " + status);
			});
		} else {
			confirming = "Operation canceled!";
			alert(confirming)
			
		}*/
	});
});