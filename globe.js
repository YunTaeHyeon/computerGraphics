var canvas;
var gl;

var numTimesToSubdivide = 6;

var index = 0;

var pointsArray = [];


var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

var va = vec4(0.0, 0.0, -1.0,1); //벡터 a부터 d까지 설정
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var progrm;

var ctm;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

function triangle(a, b, c) {

     pointsArray.push(a); //삼각형의 점 push하고 다음 삼각형을 위해
     pointsArray.push(b); //index를 증가시킨다.
     pointsArray.push(c);

     index += 3;

}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true); //텍스쳐 좌표값의 범위는 0.0과 1.0 사이의 값으로 정규화된다
        ac = normalize(ac, true); //법선을 구할 수 있다.
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}


function tetrahedron(a, b, c, d, n) { //사면체 만들기 위한 함수
    divideTriangle(a, b, c, n);  //구를 만들기 위해 필요하다
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

window.onload = function init() { //onload를 init으로 정의

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL error" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height ); //viewport 설정
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 ); //screen color 초기화

    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    //shader를 로드하고 버퍼를 초기화한다.

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    document.getElementById("Button1").onclick = function(){theta += dr;}; //버튼 눌렀을 때 작동
    document.getElementById("Button2").onclick = function(){theta -= dr;};
    document.getElementById("Button3").onclick = function(){phi += dr;};
    document.getElementById("Button4").onclick = function(){phi -= dr;};

    var image = document.getElementById("map"); //texImage에서 image 가져오기

    texture = gl.createTexture(); //택스쳐 생성
    gl.bindTexture( gl.TEXTURE_2D, texture ); 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //픽셀 저장모드 지정
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, //필터모드 결정함수 min filter니까 축소
                      gl.NEAREST_MIPMAP_LINEAR ); //mipmap을 이용하여 미리 필터링 된 점점 축소되는 해상도의 텍스쳐 사용 가능
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST ); //mag filter니까 확대
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    

    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    window.requestAnimationFrame(render);
}
