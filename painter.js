let c =false;
function openCvReady() {
      let Draw_event = false;
      let toggle =false;
      let mode = null;
      let color = "green";
    //   let strokeID = document.getElementById("stroke_value");
    //   let stroke_str = strokeID.innerHTML;
    //   let stroke_value = 5; //By default
    //   if(stroke_str[19] == 'p')
    //     stroke_value = parseInt(stroke_str[18]);
    //   else 
    //     stroke_value = parseInt(stroke_str[18]+stroke_str[19]);
      //hide sketch
      document.querySelector("#sketchpad").style.display="none";
      document.querySelector("#rendered").style.display="none";
      document.querySelector("#clear_btn").style.display="none";
      document.querySelector("#save_btn").style.display="none";
    //   document.querySelector("#stroke").style.display="none";
      document.querySelector("#virtual").style.display="none";

      document.querySelector("#Exit_Button").style.display="block"; 
      document.querySelector("p").style.display="block";      
     
  // Canvas Queries and exit button
      const output_canvas = document.querySelector("#virtual_painter_Canvas");
    //   a = output_canvas.innerHTML;
    //   console.log("output canvas : ",a);
      if(output_canvas.innerHTML == "")
        output_canvas.innerHTML = '<video id="cam_input" height="480" width="640" ></video>'+'<canvas id="canvas_output2" className="s"></canvas>'+
        '<canvas id="canvas_output3" className="s"></canvas>';
      const Exit_button = document.getElementById("Exit_Button");
      if(Exit_button == "")
        Exit_button.innerHTML ='<button id="Exit_Button2" onClick={exit_now}>Exit</button>';
     

  //---------------------------------------------------- Generating Mode Values
      const modes = ['toggle','hold'];
      // generate the radio group        
      const group = document.querySelector("#mode");
      if(group.innerHTML == "")
        group.innerHTML += modes.map((modes) => `
                <input type="radio" name="mode" value="${modes}" id="${modes}">
                <label for="${modes}">${modes}</label>
            `).join(' ');
     
  
      // add an event listener for the change event
      const radioButtons = document.querySelectorAll('input[name="mode"]');
      for(const radioButton of radioButtons){
          radioButton.addEventListener('change', showSelected);
      }        
  
      function showSelected(e) {
          if (this.checked)
              mode=this.value;
      }
  //---------------------------------------------------- Display divisions again in case exit
     output_canvas.style.display='block';
     group.style.display='flex';
     Exit_button.style.display ='inline';
    //   Exit_button.style.display='inline';
      c=false;
  
  //---------------------------------------------------- Event handler for pressing on space 
      window.addEventListener("keydown", function(event) 
      {
          if (event.defaultPrevented) 
          {
              return;
          }
          if (event.code === "Space" && mode == "hold") // handle space hold when space is pressed
          {
              Draw_event = true;
            //   console.log('Space');
          }
          else if (event.code === "Space" && mode == "toggle") // handle space toggle
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
      event.preventDefault();
      }, true);
  
  //------------------------------------------------------------------- Event handler for releasing space
      window.addEventListener("keyup", function(event) 
      {
          if (event.defaultPrevented) 
          {
              return;
          }
          if (event.code === "Space" && mode == "hold") // handle space hold when space is released
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
          else if (event.code === "Space" && mode == "toggle" && toggle ==true) // handle space toggle when space is released
          {
              Draw_event = true;
            //   console.log('Space');
          }
      event.preventDefault();
      }, true);
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
      let color_points = [];
      let connect = [];
      let kernel = new cv.Mat.ones(5,5,cv.CV_8UC1);
  
      let cap = new cv.VideoCapture(cam_input);
  
  //------------------------------------------------------------------- Processing
      const FPS = 24;
      function processVideo() {
        if(c==true)  
          {
            // console.log(output_canvas.style.display);
            output_canvas.style.display='none';
            group.style.display='none';
            Exit_button.style.display = 'none';
            document.querySelector("#virtual").style.display='inline';
            src.delete();
            hsv.delete();
            mask.delete();
            paint_window.delete(); 
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
  
            //   let lower_hue = document.getElementById('lower_hue').value;
            //   let upper_hue = document.getElementById('upper_hue').value;
            //   let lower_sat = document.getElementById('lower_sat').value;
            //   let upper_sat = document.getElementById('upper_sat').value;
            //   let lower_val = document.getElementById('lower_val').value;
            //   let upper_val = document.getElementById('upper_val').value;
        
        //   let lower_hsv_a = [lower_hue, lower_sat, lower_val];
        //   let upper_hsv_a = [upper_hue, upper_sat, upper_val];
            let lower_hsv_a = [];
            let upper_hsv_a = [];

            if(color =='green')
            {
                lower_hsv_a = [56,66,0];
                upper_hsv_a = [100,255,255];
            }

  
        //   console.log('lower : ',lower_hsv_a);
        //   console.log('upper : ',upper_hsv_a);
  
       let lower_hsv = cv.matFromArray(1, 3, cv.CV_8UC1, lower_hsv_a);
       let upper_hsv = cv.matFromArray(1, 3, cv.CV_8UC1, upper_hsv_a);
  
       let rect1  = new cv.Point(40, 1);
       let rect2  = new cv.Point(140, 65);
       let rect3  = new cv.Point(49,33);
       let clear = cv.rectangle(src, rect1, rect2, [0,0,0,0],1 );
       cv.putText(src, 'Clear all', rect3, cv.FONT_HERSHEY_SIMPLEX, 0.5, [0,0,0,0],2); //(input , text , position , font , font scale , color , thickness)
   
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
              for(var i=0;i<contours.size();i++)
              {
                  cnt = contours.get(i);
                  area = cv.contourArea(cnt, false);
                  if(area >max)
                  {
                      max = area;
                  }
              }
  
              let M = cv.moments(cnt, false);
              center = [M.m10/M.m00,M.m01/M.m00];
              
              if ( (center[1] <= 65) && (40 <= center[0] <= 140))
              {
                  points = [];
                  connect = [];
                  color_points = [];
                  paint_window.delete();
                  paint_window = new cv.Mat(video.height, video.width, cv.CV_8UC4, [255,255,255,255]);
              }
              // if the points and event on exist then push else don't
              else if(center[0] && (Draw_event == true))
              {
                  points.push(center);
                  connect.push(true); //this point is connected to next one until the opposite is proved
                  color_points.push(rgba);
              }
          }
  
      //----------------------------------------------------------- Drawing Line
          for(var i=1;i<points.length;i++)
          {
                  //  if the current point is connected to the last point then draw else don't
                  if(connect[i-1])
                  {
                      let p1  = new cv.Point(points[i][0], points[i][1]);
                      let p2  = new cv.Point(points[i-1][0], points[i-1][1]);
                      cv.line(src, p1, p2, color_points[i] ,stroke_value); // Last parameter is the thickness
                      cv.line(paint_window, p1, p2, color_points[i] ,stroke_value); // Last parameter is the thickness
                  }
          }
        //   console.log('POINTS : ' , points);
  
  
      //----------------------------------------------------------- IM SHOW
        //   cv.imshow("canvas_output", mask);
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
    document.querySelector("#stroke").style.display="block"; 
    document.querySelector("p").style.display="none"; 
}