---
layout: post
title:  Can’t access the Magento admin?
date:   2015-02-26 22:30:00
categories: Magento
---
Did you lock yourself out? Can't access the Magento admin? We can take several approaches to this problem.

The first one is to log on to your Magento installations database. Go to the `admin_user` table and add a user or change the password of your admin user. When adding the password use the `MD5` function.

Another simple solution is to make a module with an install-script
that adds a new admin user. The next solution is to [download][newadmin] a finished module that do it for you.

Logg on with ftp/ssh and drag the app folder in to the root of
your installation. Merge the folder do not replace it! Then go to your Magento page. Navigate to your admin log in and use the user name "you" and the password "welcome99".

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




[newadmin]:https://github.com/AndersWik/Magento_Wik_Newadmin
