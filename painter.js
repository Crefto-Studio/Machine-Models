let c =false;
function openCvReady() {
      c=false;
      let Draw_event = false;
      let toggle =false;
      let mode = null;
      let color = "green";
      let delay_permission = true;
      

      //hide sketch
      document.querySelector("#sketchpad").style.display="none";
      document.querySelector("#rendered").style.display="none";
      document.querySelector("#clear_btn").style.display="none";
      document.querySelector("#save_btn").style.display="none";
      document.querySelector("#save_btn2").style.display="none";
      document.querySelector("#virtual").style.display="none";
      document.querySelector("#share").style.display="none";

      document.getElementById("model-canvas").style.display="none";

      document.querySelector("#Exit_Button").style.display="block"; 
      document.querySelector("#config_btn").style.display="block";
      document.querySelector("#Modes").style.display="flex";  
      document.querySelector("#virtual_painter_Canvas").style.display="flex"; 
      document.querySelector("#canvas_output1").style.display="none"; 
      document.querySelector("#canvas_output2").style.display="block";
      document.querySelector("#canvas_output3").style.display="block";
         
     
      // add an event listener for the change event
      const radioButtons = document.querySelectorAll('input[name="mode"]');
      for(const radioButton of radioButtons){
          radioButton.addEventListener('change', showSelected);
      }        
  
      function showSelected(e) {
          if (this.checked)
              mode=this.value;
      }
    //   if(mode == null)
    //     mode ="hold";
  //---------------------------------------------------- Display divisions again in case exit
    //  output_canvas.style.display='block';
    //  group.style.display='flex';
    //  Exit_button.style.display ='inline';
    //   Exit_button.style.display='inline';
    //   c=false;
  
  //---------------------------------------------------- Event handler for pressing on space 
      const keydownHandler = function(event){
        if (event.defaultPrevented) 
        {
            return;
        }
        if (event.code == "Space" && mode == "hold") // handle space hold when space is pressed
        {
            Draw_event = true;
          //   console.log('Space');
          //   console.log('draw_event',Draw_event);
        }
        else if (event.code == "Space" && mode == "toggle") // handle space toggle
        {
            if(toggle == false) // if toggle was false and i pressed on space then this is an order to start drawing
            {
                Draw_event = true;
                toggle = true;
              //   console.log('Space');
            }
            else if(toggle == true) // if toggle was true and i pressed on space then this is an order to stop drawing
            {
                Draw_event = false;
                toggle = false;
                //manage connectivity :
                connect.pop();
                connect.push(false); // it means this point is not connected to the next one
            }
        }
        else if(event.code == "Space" && (mode == "line-toggle" || mode == "circle-toggle")) // to draw the line
        {
          Draw_event = true;
        }
    event.preventDefault();
    }
    window.addEventListener("keydown", keydownHandler , true);
  //------------------------------------------------------------------- Event handler for releasing space
      const keyupHandler = function(event){
        if (event.defaultPrevented) 
        {
            return;
        }
        if (event.code == "Space" && mode == "hold") // handle space hold when space is released
        {
            //manage connectivity :
            if(Draw_event)
            {
                Draw_event = false;
                connect.pop();
                connect.push(false);
              //   console.log('Space false');
            }
        }
        else if (event.code == "Space" && mode == "toggle" && toggle ==true) // handle space toggle when space is released
        {
            Draw_event = true;
          //   console.log('Space');
        }
        else if(event.code == "Space" && (mode == "line-toggle" || mode == "circle-toggle"))
        {
          Draw_event = false;
          // setTimeout(function(){ delay_permission = true;}, 500);
          delay_permission = true;
        }
    event.preventDefault();
    }
    window.addEventListener("keyup", keyupHandler, true);
  //------------------------------------------------------------------- Setup
      let video = document.getElementById("cam_input"); // video is the id of video tag
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(function(stream) {
          video.srcObject = stream;
          video.play();
      })
      .catch(function(err) {
          console.log("An error occurred! " + err);
      });
      video.style.display="none";
  //------------------------------------------------------------------ Initialization
      let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
      let hsv = new cv.Mat(video.height, video.width, cv.CV_8UC1);
      let mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
      let paint_window = new cv.Mat(video.height, video.width, cv.CV_8UC4, [255,255,255,255]);
      let points = [];
      let line_points =[];
      let circle_points =[];
      let color_points = [];
      let color_line_points = [];
      let color_circle_points = [];
      let stroke_points= [];
      let stroke_line_points= [];
      let stroke_circle_points= [];
      let connect = [];
      let kernel = new cv.Mat.ones(5,5,cv.CV_8UC1);
  
      let cap = new cv.VideoCapture(cam_input);
  
  //------------------------------------------------------------------- Processing
      const FPS = 24;
      function processVideo() {
        if(c==true)  
          {
            src.delete();
            hsv.delete();
            mask.delete();
            let canvas = document.querySelector("#sketchpad");
            let ctx = canvas.getContext('2d');
            let imageData= ctx.createImageData(paint_window.cols,paint_window.rows);
            imageData.data.set(new Uint8ClampedArray(paint_window.data,paint_window.cols,paint_window.rows));
            canvas.height=paint_window.rows;
            canvas.width=paint_window.cols;
            arr=imageData.data;
            console.log("in:",arr);
            ctx.putImageData(imageData,0,0);
            paint_window.delete(); 
            window.removeEventListener("keydown", keydownHandler , true);
            window.removeEventListener("keyup", keyupHandler, true);
            for(const radioButton of radioButtons){
                radioButton.checked = false;
            } 
            return; 
          }
          
        let begin = Date.now();
        cap.read(src);
        cv.flip(src,src,1);
        let stroke_value = parseInt(document.getElementById('stroke_width').value);
        let paint_Color = document.getElementById('colorValue').style.background;
        let rgba =[];
        let value="";
        for(let i=4; i<paint_Color.length ; i++)
        {
            if(paint_Color[i] == ' ')
                continue ;
            else if ( paint_Color[i] == ',' || paint_Color[i] == ')' )
            {
                rgba.push(parseInt(value));
                value= "";
            }
            else
                value = value + paint_Color[i];
        }
        rgba.push(255);
          //src.copyTo(hsv);
  
                let lower_hue = document.getElementById('lower_hue').value;
                let upper_hue = document.getElementById('upper_hue').value;
                let lower_sat = document.getElementById('lower_sat').value;
                let upper_sat = document.getElementById('upper_sat').value;
                let lower_val = document.getElementById('lower_val').value;
                let upper_val = document.getElementById('upper_val').value;
            
            let lower_hsv_a = [lower_hue, lower_sat, lower_val];
            let upper_hsv_a = [upper_hue, upper_sat, upper_val];
            // let lower_hsv_a = [];
            // let upper_hsv_a = [];

            // if(color =='green')
            // {
            //     lower_hsv_a = [56,66,0];
            //     upper_hsv_a = [100,255,255];
            // }

  
        //   console.log('lower : ',lower_hsv_a);
        //   console.log('upper : ',upper_hsv_a);
  
       let lower_hsv = cv.matFromArray(1, 3, cv.CV_8UC1, lower_hsv_a);
       let upper_hsv = cv.matFromArray(1, 3, cv.CV_8UC1, upper_hsv_a);
  
       let rect1  = new cv.Point(40, 1);
       let rect2  = new cv.Point(140, 65);
       let rect3  = new cv.Point(49,33);
       let clear = cv.rectangle(src, rect1, rect2, [0,0,0,255],5 );
       cv.putText(src, 'Clear all', rect3, cv.FONT_HERSHEY_SIMPLEX, 0.65, [0,0,0,255],2); //(input , text , position , font , font scale , color , thickness)
   
       let k = Array(5);
       for (var i = 0; i < 5; i++) {
          k[i] = Array(5).fill(1);
       }
  
       //---------------------------------------------------------- creating kernel for morphological operations 
          cv.cvtColor(src,hsv, cv.COLOR_BGR2HSV);
          cv.inRange(hsv ,lower_hsv, upper_hsv , mask);
          cv.erode(mask ,mask , kernel);
          cv.morphologyEx(mask,mask , cv.MORPH_OPEN, kernel);
          cv.dilate(mask,mask , kernel);
  
      //----------------------------------------------------------- Find Contours
          let contours = new cv.MatVector();
          let hierarchy = new cv.Mat();
          cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
          //let center = Null;
          let center =[0,0];
          if(contours.size() > 0)
          {
              // getting the contour of max area
              let area = 0;
              let max= 0;
              let cnt = 0;
              let current_cnt=0;
              for(var i=0;i<contours.size();i++)
              {
                    current_cnt = contours.get(i);
                    area = cv.contourArea(current_cnt, false);
                    if(area >max)
                    {
                        max = area;
                        cnt = current_cnt;
                    }
              }
  
              let M = cv.moments(cnt, false);
              center = [M.m10/M.m00,M.m01/M.m00];
                          //   console.log('center',center);
              let p  = new cv.Point(center[0], center[1]);

              //Marker
              cv.line(src, p, p, rgba ,stroke_value); // Last parameter is the thickness  
              if(center[0] && Draw_event == true)
              {
                    //case clear all
                    if ( (center[0] <= 150) && (center[1] <= 65))
                    {
                        points = [];
                        connect = [];
                        color_points = [];
                        stroke_points = [];
                        line_points = [];
                        color_line_points =[];
                        stroke_line_points = [];
                        circle_points =[];
                        color_circle_points =[];
                        stroke_circle_points = [];
                        delay_permission = true;
                        Draw_event= false;
                        toggle =false;
                        // paint_window.delete();
                        // paint_window = new cv.Mat(video.height, video.width, cv.CV_8UC4, [255,255,255,255]);
                    }
                    // case connected points
                    else if(mode == 'hold' || mode =='toggle')
                    {
                        points.push(center);
                        connect.push(true); //this point is connected to next one until the opposite is proved
                        color_points.push(rgba);
                        stroke_points.push(stroke_value);
                    }
                    // case line points
                    else if(mode == 'line-toggle' && delay_permission == true)
                    {
                        line_points.push(center);
                        color_line_points.push(rgba);
                        stroke_line_points.push(stroke_value);
                        delay_permission = false ;
                    }
                    // case circle points
                    else if(mode == 'circle-toggle' && delay_permission == true)
                    {
                        circle_points.push(center);
                        color_circle_points.push(rgba);
                        stroke_circle_points.push(stroke_value);
                        delay_permission = false ;
                    }
              }
          }
  
      //----------------------------------------------------------- Drawing
          console.log('POINTS : ',points);
          // Draw the connected points
          for(var i=1;i<points.length;i++)
          {
                  //  if the current point is connected to the last point then draw else don't
                  if(connect[i-1])
                  {
                      let p1  = new cv.Point(points[i][0], points[i][1]);
                      let p2  = new cv.Point(points[i-1][0], points[i-1][1]);
                      cv.line(src, p1, p2, color_points[i] ,stroke_points[i]); // Last parameter is the thickness
                      //Just draw the latest point in paint draw (for optimization purpose).
                      if(i == points.length-1)
                        cv.line(paint_window, p1, p2, color_points[i] ,stroke_points[i]);
                  }
          }
          
          //Draw the Lines (if exist)
          for(var i=0;i<line_points.length;i++)
          {
                let p1  = new cv.Point(line_points[i][0], line_points[i][1]);
                if(i%2 == 0)
                {
                    cv.line(src, p1, p1, color_line_points[i] ,stroke_line_points[i]);
                }
                else 
                {
                    let p2  = new cv.Point(line_points[i-1][0], line_points[i-1][1]);
                    cv.line(src, p1, p2, color_line_points[i] ,stroke_line_points[i]);
                    //Just draw the latest point in paint draw (for optimization purpose).
                    if(i == line_points.length-1)
                        cv.line(paint_window, p1, p2, color_line_points[i] ,stroke_line_points[i]);
                }
          }

          // Draw the Circles
          for(var i=0;i<circle_points.length;i++)
          {
                if((i==circle_points.length - 1) && (i%2 == 0))
                {
                    let p1  = new cv.Point(circle_points[i][0], circle_points[i][1]);
                    cv.line(src, p1, p1, color_circle_points[i] ,stroke_circle_points[i]);
                }
                else if(i%2 !=0)
                {
                    let pcenter  = new cv.Point(circle_points[i-1][0], circle_points[i-1][1]);
                    cx = circle_points[i-1][0];
                    cy = circle_points[i-1][1];
                    px = circle_points[i][0];
                    py = circle_points[i][1];
                    
                    radius = Math.abs(((cx-px)^2 + (cy -py)^2)^0.5);
                    console.log('radius' , radius);
                    cv.circle(src, pcenter, radius, color_circle_points[i] ,stroke_circle_points[i]);
                    if(i == circle_points.length-1)
                        cv.circle(paint_window, pcenter, radius, color_circle_points[i] ,stroke_circle_points[i]);
                }
          }
  
  
      //----------------------------------------------------------- IM SHOW
          if(document.querySelector("#ex_config").style.display =="block") 
            cv.imshow("canvas_output1", mask);
          cv.imshow("canvas_output2", src);
          cv.imshow("canvas_output3", paint_window);
          // schedule next one.
          let delay = 1000/FPS - (Date.now() - begin);
          setTimeout(processVideo, delay);
  }
  // schedule first one.
  setTimeout(processVideo, 0);
    };

function exit_now()
{
    c = true;

    document.querySelector("#sketchpad").style.display="block";
    document.querySelector("#rendered").style.display="flex";
    document.querySelector("#clear_btn").style.display="block";
    document.querySelector("#save_btn").style.display="block";
    document.querySelector("#save_btn2").style.display="block";
    document.querySelector("#share").style.display="block";
    document.querySelector("#stroke").style.display="block"; 
    document.querySelector("#virtual").style.display="block";
    // document.querySelector("p").style.display="none"; 
    document.querySelector("#Exit_Button").style.display="none"; 
    document.querySelector("#Modes").style.display="none";  
    document.querySelector("#virtual_painter_Canvas").style.display="none"; 
    document.querySelector("#navbar").style.display="none"; 
    document.querySelector("#config_btn").style.display="none";
    document.querySelector("#ex_config").style.display="none";

//mohamed amr
    //mohamed amr
//     let canvas = document.querySelector("#sketchpad");
//     let ctx = canvas.getContext('2d');
//     var data=ctx.getImageData(0, 0, canvas.width, canvas.height);
//     console.log(data.data);

//      //take alpha
//      var alpha = data.data.filter(function (v, i) {
//         return i % 4 == 3;
//     });
//     //take blue
//     var blue = data.data.filter(function (v, i) {
//         return i % 4 == 2;
//     });
//     //take green
//     var green = data.data.filter(function (v, i) {
//         return i % 4 == 1;
//     });
//     //take red
//     var red = data.data.filter(function (v, i) {
//         return i % 4 == 0;
//     });

// // let red_obj={};
// // Object.assign(red_obj, red);
// // let text=red.join();
// // red_obj["r"]=[];
// // red_obj["r"]=red

// var normalred = Array.from(red);
// var normalgreen = Array.from(green);
// var normalblue = Array.from(blue);
// var normalalpha = Array.from(alpha);
//     let obj = {};
//     obj["ALPHA"]=normalalpha;
//     obj["BLUE"]=normalblue;
//     obj["GREEN"]=normalgreen;
//     obj["RED"]=normalred;
    
    
   
//     console.log(obj); 

   
    
//     const myJSON = JSON.stringify(obj);
//     console.log(myJSON);
}

function config(){
    document.querySelector("#navbar").style.display="flex"; 
    document.querySelector("#virtual_painter_Canvas").style.display="flex"; 
    document.querySelector("#canvas_output1").style.display="block";
    document.querySelector("#canvas_output3").style.display="none";  
    document.querySelector("#config_btn").style.display="none";
    document.querySelector("#ex_config").style.display="block";
    document.querySelector("#Modes").style.display="none"; 
}

function exit_config(){
    document.querySelector("#navbar").style.display="none";
    document.querySelector("#canvas_output1").style.display="none";
    document.querySelector("#canvas_output3").style.display="block"; 
    document.querySelector("#config_btn").style.display="block";
    document.querySelector("#ex_config").style.display="none";
    document.querySelector("#Modes").style.display="flex"; 
}

//for post
//toggle
function display_pop(){
    document.getElementById('wrapper').style.display="block";
}
function lock_pop(){
    document.getElementById('wrapper').style.display="none";
}

//for del btn
function trash(){
    document.querySelector('#title').value = '';
    document.querySelector('#desc').value = '';
  //   quill.setText('');
  //   toaster('Trashed');
  }

  
  //model
  function run_model(){
    document.getElementById("model-canvas").style.display="flex";
    document.getElementById("rendered").style.display="none";
    let canvas = document.querySelector("#model-canvas");
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = "red";
    ctx.fillRect(100, 100, 50, 50);

  }




  function dataURLtoFile(dataurl, filename) {
    // convert base64 to raw binary data held in a string
   // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
   var byteString = atob(dataurl.split(',')[1]);

   // separate out the mime component
   var mimeString = dataurl.split(',')[0].split(':')[1].split(';')[0];

   // write the bytes of the string to an ArrayBuffer
   var ab = new ArrayBuffer(byteString.length);
   var ia = new Uint8Array(ab);
   for (var i = 0; i < byteString.length; i++) {
       ia[i] = byteString.charCodeAt(i);
   }

   //New Code
   return new Blob([ab], {type: mimeString});
}

  function post_prof(){
    document.getElementById('post_btn').innerHTML='<i class="fas fa-spinner fa-spin"></i>';
    var d=document.getElementById("Drawing");
    var o=document.getElementById("Output");
    if(d.checked){
        let canvas = document.querySelector("#sketchpad");
        let ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation="destination-over";
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    
        url = document.getElementById('sketchpad').toDataURL();
    }
    else{
    let canvas = document.querySelector("#model-canvas");
    let ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation="destination-over";
    ctx.beginPath();
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#ffffff";
	ctx.fill();

    url = document.getElementById('model-canvas').toDataURL();
    }
    // console.log(url);

    var fileData = dataURLtoFile(url, "imageName.png");
    console.log("Here is JavaScript File Object", fileData);

    let token = document.cookie;
    console.log(token);
	token = token.split("=");

    var formdata = new FormData();
	formdata.append('name', document.getElementById('title').value);
	formdata.append('type', "Fingo");
	formdata.append('postImg', fileData);
	formdata.append('description', document.getElementById('desc').value);

	var myHeaders = new Headers();

	myHeaders.append("Authorization", `Bearer ${token[1]}`);
	console.log("222222222222222222");
	console.log(token[1]);
	var requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: formdata,
		redirect: 'follow'
	};

    fetch("http://www.api.crefto.studio/api/v1/posts", requestOptions)

		.then(response => response.json())

		.then(json => {
			console.log(json);
            if(json.status=="success"){
			// alert("mabroook");
            document.getElementById('post_btn').innerHTML='Post';
            document.getElementById('fail_cond').style.color="#49D907";
            document.getElementById('fail_cond').innerHTML="Posted Successfully";
            trash();
            }
            else{
                document.getElementById('fail_cond').style.color="#FBA504";
                document.getElementById('fail_cond').innerHTML="&nbsp;Fail!! "+json.message;
                document.getElementById('post_btn').innerHTML='Post';
            }
		})

		.catch((err) => {
			console.error(err);
		})
}


