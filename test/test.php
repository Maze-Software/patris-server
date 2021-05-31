<?php 
$pg_merchant_id = "538933";
$secret_key = "0ZOznEKNn2CrNYLY";

$request = [
    'pg_merchant_id'=> $pg_merchant_id,
    'pg_amount' => 100,
    'pg_order_id' => 12345,
    'pg_user_id' => 1234,
    'pg_card_id' => 1234,
    'pg_description' => 'Описание платежа',
    'pg_salt' => 'some random string',
];

//generate a signature and add it to the array
ksort($request); //sort alphabetically
array_unshift($request, 'init');
array_push($request, $secret_key); //add your secret key (you can take it in your personal cabinet on paybox system)

$request['pg_sig'] = md5(implode(';', $request)); // signature

unset($request[0], $request[1]);
?>

<!-- 4b741b8824105c45cf25d06ee5851cb7 -->