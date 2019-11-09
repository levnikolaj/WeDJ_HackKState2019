function sendAlert() {
	alert(text);
}

function saveText() {
  var text = document.getElementById('textbox').value;
  localStorage.setItem("textbox", text); // save the item
}
