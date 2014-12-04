<?php
require_once 'config.php';

if (isset($_GET['device'])) {
  $device = $_GET['device'];
} else {
  $device = "";
}

if (isset($camera[$device])) {
  $url = $streamURL.'/'.$camera[$device].'/';
  header('Location: '.$url);
} else {
  header('Location: no_image.jpg');
}
