


//링크된 위치에서 부터의 설정값 지정
function move_box(an, box, formid) {

  var id = formid;

  var cleft = -345;  //왼쪽마진  
  var ctop = -70;  //상단마진

  if(id == "information"){
    ;
  }else if (id == "gashipyo"){
    cleft = 50;
  }

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

function show_hide_box(an, width, height, borderStyle, formid) {

  console.log("layerpopup.js가 호출 되었습니다.");
  
  var href = "#";
  var imsi = "제발나와라";
  // 소스
  if(an.id == "tongye"){
    href = "/index.html";
    console.log("출력이되나");
    href.getElementById("gived") = "아오";

  }
  else if(an.id == "gashipyo"){
    href = "/bbyong/calendar/test.html";
  }

  var boxdiv = document.getElementById(href);  

  if (boxdiv != null) {
    if (boxdiv.style.display=='none') {
      move_box(an, boxdiv, formid);
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


  var contents = document.createElement('iframe');
 
  contents.src = href;  
  contents.frameBorder = '0';
  contents.align = 'left';
  contents.style.width = width + 'px';
  contents.style.height = height + 'px';
 
  boxdiv.appendChild(contents);
  document.body.appendChild(boxdiv);
  move_box(an, boxdiv, formid);  

  return false;
}