function sendAlert(text) {
	alert(text);
}

function saveText() {
  var textboxText = document.getElementById("textbox").value;
  sendAlert(textboxText);
}
