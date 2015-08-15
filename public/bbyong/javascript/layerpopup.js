
//링크된 위치에서 부터의 설정값 지정
function move_box(an, box) {

  var cleft = 20;  //왼쪽마진  
  var ctop = 20;  //상단마진

  var obj = an;
  
  while (obj.offsetParent) {
    cleft += obj.offsetLeft;
    ctop += obj.offsetTop;
    obj = obj.offsetParent;
  }
  
  box.style.left = cleft + 'px';

  ctop += an.offsetHeight + 8;
 
  if (document.body.currentStyle &&
    document.body.currentStyle['marginTop']) {
    ctop += parseInt(
      document.body.currentStyle['marginTop']);
  }

    box.style.top = ctop + 'px';
}

function show_hide_box(an, width, height, borderStyle) {

  console.log("호출 되었습");
  
  // 소스
  var href = an.href;

  var boxdiv = document.getElementById(href);  

  if (boxdiv != null) {
    if (boxdiv.style.display=='none') {
      move_box(an, boxdiv);
      boxdiv.style.display='block';
    } else{
      boxdiv.style.display='none';
    }
    return false;
  }  

  boxdiv = document.createElement('div');

  boxdiv.setAttribute('id', href);
  boxdiv.style.display = 'block';
  boxdiv.style.position = 'absolute';
  boxdiv.style.width = width + 'px';
  boxdiv.style.height = height + 'px';
  boxdiv.style.border = borderStyle;
  boxdiv.style.backgroundColor = '#fff';  


  var contents = document.createElement('iframe');
  
  contents.scrolling = 'no';
  contents.frameBorder = '0';
  contents.style.width = width + 'px';
  contents.style.height = height + 'px';
  contents.src = href;  
  boxdiv.appendChild(contents);
  document.body.appendChild(boxdiv);
  move_box(an, boxdiv);  

  return false;
}