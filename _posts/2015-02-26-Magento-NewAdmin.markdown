---
layout: post
title:  Can’t access the Magento admin?
date:   2015-02-26 22:30:00
categories: Magento
---
Did you lock yourself out and can't access the Magento admin? We can take several approaches to this problem.

The first one is to log on to your Magento installations database. Go to the `admin_user` table and add a user or change the password of your current admin user. When adding the password use the `MD5` function for the password column.

Another simple solution is to make a module with an install-script
that adds a new admin user.

{% highlight bash %}
<?php
$installer = $this;
$installer->startSetup();

$userName = "you";
$firstName = "you";
$lastName = "youagain";
$email = "you@example.com";
$password = "welcome99";

try {
  $user = Mage::getModel("admin/user")
  ->setUsername($userName)
  ->setFirstname($firstName)
  ->setLastname($lastName)
  ->setEmail($email)
  ->setPassword($password)
  ->save();
  $role = Mage::getModel("admin/role");
  $role->setParent_id(1);
  $role->setTree_level(1);
  $role->setRole_type('U');
  $role->setUser_id($user->getId());
  $role->save();
} catch (Exception $ex) {
  Mage::helper('newadmin')->log($ex);
}
{% endhighlight %}

The third way is to create a php script and put it in the root folder of your site.

{% highlight bash %}
<?php
require 'app/Mage.php';
umask(0);
Mage::app();

$userName = "you";
$firstName = "you";
$lastName = "youagain";
$email = "you@example.com";
$password = "welcome99";

try {
  $user = Mage::getModel("admin/user")
  ->setUsername($userName)
  ->setFirstname($firstName)
  ->setLastname($lastName)
  ->setEmail($email)
  ->setPassword($password)
  ->save();
  $role = Mage::getModel("admin/role");
  $role->setParent_id(1);
  $role->setTree_level(1);
  $role->setRole_type('U');
  $role->setUser_id($user->getId());
  $role->save();
} catch (Exception $ex) {
  Mage::log($ex);
}
{% endhighlight %}

Login with ftp/ssh and drag the script to the root folder of your Magento installation. Then go to your Magento installations url/[script-name]. Navigate to your admin and log in with the user name "you" and the password "welcome99".
