function openCvReady() {
    cv['onRuntimeInitialized']=()=>{
      let Draw_event = false;
      let toggle =false;
      let mode = null;
  //---------------------------------------------------- Generating Mode Values
      const modes = ['toggle','hold'];
  
      // generate the radio group        
      const group = document.querySelector("#Modes");
      group.innerHTML = modes.map((modes) => `<div>
              <input type="radio" name="mode" value="${modes}" id="${modes}">
              <label for="${modes}">${modes}</label>
          </div>`).join(' ');
  
      // add an event listener for the change event
      const radioButtons = document.querySelectorAll('input[name="mode"]');
      for(const radioButton of radioButtons){
          radioButton.addEventListener('change', showSelected);
      }        
  
      function showSelected(e) {
          if (this.checked)
              mode=this.value;
      }
  
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
              console.log('Space');
          }
          else if (event.code === "Space" && mode == "toggle") // handle space toggle
          {
              if(toggle == false) // if toggle was false and i pressed on space then this is an order to start drawing
              {
                  Draw_event = true;
                  toggle = true;
                  console.log('Space');
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
                  console.log('Space false');
              }
          }
          else if (event.code === "Space" && mode == "toggle" && toggle ==true) // handle space toggle when space is released
          {
              Draw_event = true;
              console.log('Space');
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
  
  //------------------------------------------------------------------ Initialization
      let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
      let hsv = new cv.Mat(video.height, video.width, cv.CV_8UC1);
      let mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
      let paint_window = new cv.Mat(video.height, video.width, cv.CV_8UC4, [255,255,255,255]);
      let points = [];
      let connect = [];
      let kernel = new cv.Mat.ones(5,5,cv.CV_8UC1);
  
      let cap = new cv.VideoCapture(cam_input);
  
  //------------------------------------------------------------------- Processing
      const FPS = 24;
      function processVideo() {
          let begin = Date.now();
          cap.read(src);
          //src.copyTo(hsv);
  
              let lower_hue = document.getElementById('lower_hue').value;
              let upper_hue = document.getElementById('upper_hue').value;
              let lower_sat = document.getElementById('lower_sat').value;
              let upper_sat = document.getElementById('upper_sat').value;
              let lower_val = document.getElementById('lower_val').value;
              let upper_val = document.getElementById('upper_val').value;
  
          let lower_hsv_a = [lower_hue, lower_sat, lower_val];
          let upper_hsv_a = [upper_hue, upper_sat, upper_val];
  
          // console.log('lower : ',lower_hsv_a);
          // console.log('upper : ',upper_hsv_a);
  
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
              
              if ( (center[1] <= 65) && (40<= center[0] <= 140))
              {
                  points = [];
                  connect = [];
                  paint_window.delete();
                  paint_window = new cv.Mat(video.height, video.width, cv.CV_8UC4, [255,255,255,255]);
              }
              // if the points and event on exist then push else don't
              else if(center[0] && (Draw_event == true))
                  {
                      points.push(center);
                      connect.push(true);//this point is connected to next one until the opposite is proved
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
                      cv.line(src, p1, p2, [0, 255, 0, 255],5); // Last parameter is the thickness
                      cv.line(paint_window, p1, p2, [0, 255, 0, 255],5); // Last parameter is the thickness
                  }
          }
  
  
      //----------------------------------------------------------- IM SHOW
          cv.imshow("canvas_output", mask);
          cv.imshow("canvas_output2", src);
          cv.imshow("canvas_output3", paint_window);
          // schedule next one.
          let delay = 1000/FPS - (Date.now() - begin);
          setTimeout(processVideo, delay);
  }
  // schedule first one.
  setTimeout(processVideo, 0);
    };
  }
