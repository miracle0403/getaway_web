/*functions to export */

function random_number(arr){
	return Math.floor(Math.random() * arr.length)
	
}

export.generatepass(){
	var pass = []
	var numbers = [1,2,3,4,5,6,7,8,9,0]
	var caps = ['a','b', 'c', 'd', 'e', 'f', 'g' ,'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
	var lower = ['a','b', 'c', 'd', 'e', 'f', 'g' ,'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
	var symbols = ['!', '@', '£', '$', '%', '&']
	var rand_number = random_number(numbers)
	var rand_caps = random_number(caps)
	var rand_lower = random_number(lower)
	var rand_symbols = random_number(symbols)
	var pass-length = 9
	
	while (pass.length < 2){
		pass.append(numbers[rand_number])
	}
	
	while (pass.length < 4){
		pass.append(caps[rand_caps])
	}
	
	while (pass.length < 6){
		pass.append(symbols[rand_symbols])
	}
	
	while (pass.length < 9){
		pass.append(lower[rand_lower])
	}
}


