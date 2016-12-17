---
layout: post
title:  Magento Developer Certification Sales and Customers (Customer)
date:   2016-11-30 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Sales and Customers (Customer)`.

9 - Sales and Customers
=======================

Customer
-------------------

### Describe the architecture of the customer module

### Describe the role of customer addresses

### Describe how to add, modify, and display customer attributes:

{% highlight php %}
`<?php
$installer->startSetup();
$installer->addAttribute('customer', 'my_attribute', array(
    'type'      => 'varchar',
    'label'     => 'My Attribute',
    'input'     => 'text',
    'position'  => 120,
    'required'  => false,
    'is_system' => 0,
));
$attribute = Mage::getSingleton('eav/config')->getAttribute('customer', 'my_attribute');
$attribute->setData('used_in_forms', array(
    'adminhtml_customer',
    'checkout_register',
    'customer_account_create',
    'customer_account_edit',
));
$attribute->setData('is_user_defined', 0);
$attribute->save();
$installer->endSetup();`
{% endhighlight %}

{% highlight xml %}
<?xml version="1.0"?>
<config>
 <modules>
  <My_Module>
   <version>1.0.0</version>
  </My_Module>
  </modules>
  <global>
   <helpers>
    <mymodule>
     <class>StackExchange_Customer_Helper</class>
    </mymodule>
   </helpers>
   <resources>
   <mymodule_customer_setup>
    <setup>
     <module>My_Module</module>
     <class>Mage_Customer_Model_Resource_Setup</class>
    </setup>
   </mymodule_customer_setup>
  </resources>
 </global>
</config>
{% endhighlight %}

#### What is the structure of tables in which customer information is stored?

* `customer_address_entity`
	* `customer_address_entity_{type}`
		* `customer_address_entity_datetime`
		* `customer_address_entity_decimal`
		* `customer_address_entity_int`
		* `customer_address_entity_text`
		* `customer_address_entity_varchar`

* `customer_entity`
	* `customer_entity_{type}`
		* `customer_entity_datetime`
		* `customer_entity_decimal`
		* `customer_entity_int`
		* `customer_entity_text`
		* `customer_entity_varchar`

#### What is the customer resource model?

* [Mage_Customer_Model_Resource_Customer][Mage_Customer_Model_Resource_Customer]

#### How is customer information validated?

* [Mage_Customer_Model_Customer::validate()][Mage_Customer_Model_Customer::validate]

{% highlight php %}
`<?php
public function validate()
{
 $errors = array();
 if (!Zend_Validate::is( trim($this->getFirstname()) , 'NotEmpty')) {
  $errors[] = Mage::helper('customer')->__('The first name cannot be empty.');
 }

 if (!Zend_Validate::is( trim($this->getLastname()) , 'NotEmpty')) {
  $errors[] = Mage::helper('customer')->__('The last name cannot be empty.');
 }

 if (!Zend_Validate::is($this->getEmail(), 'EmailAddress')) {
  $errors[] = Mage::helper('customer')->__('Invalid email address "%s".', $this->getEmail());
 }

 $password = $this->getPassword();
 if (!$this->getId() && !Zend_Validate::is($password , 'NotEmpty')) {
  $errors[] = Mage::helper('customer')->__('The password cannot be empty.');
 }
 if (strlen($password) && !Zend_Validate::is($password, 'StringLength', array(6))) {
  $errors[] = Mage::helper('customer')->__('The minimum password length is %s', 6);
 }
 $confirmation = $this->getPasswordConfirmation();
 if ($password != $confirmation) {
  $errors[] = Mage::helper('customer')->__('Please make sure your passwords match.');
 }

 $entityType = Mage::getSingleton('eav/config')->getEntityType('customer');
 $attribute = Mage::getModel('customer/attribute')->loadByCode($entityType, 'dob');
 if ($attribute->getIsRequired() && '' == trim($this->getDob())) {
  $errors[] = Mage::helper('customer')->__('The Date of Birth is required.');
 }
 $attribute = Mage::getModel('customer/attribute')->loadByCode($entityType, 'taxvat');
 if ($attribute->getIsRequired() && '' == trim($this->getTaxvat())) {
  $errors[] = Mage::helper('customer')->__('The TAX/VAT number is required.');
 }
 $attribute = Mage::getModel('customer/attribute')->loadByCode($entityType, 'gender');
 if ($attribute->getIsRequired() && '' == trim($this->getGender())) {
  $errors[] = Mage::helper('customer')->__('Gender is required.');
 }

 if (empty($errors)) {
  return true;
 }
 return $errors;
}`
{% endhighlight %}

#### How can customer-related email templates be manipulated?

We can change the email templates in Magentos admin. Go to `System > Transactional Email` > `Add New Template`. Here we can load a template from `app/locale` and change. When done with the templates we go to `System > Configuration > Sales Email`. Here we can set our custom templates instead of the `default`.

If we want to translate the sales email templates in `app/locale` we copy the email templates from `app/locale/en_US/template/email/sales/*` to the other language `app/locale/{langcode_COUNTRYCODE}/template/email/sales/*`.

#### What is the difference between shipping and billing addresses for a customer?

#### How does the number of shipping and billing address entities affect the frontend interface for customers?

If they have more than one address they can select between the addresses on checkout.

#### How does customer information affect prices and taxes?

Different customer groups can have different catalog price rules. To add a catalog price rule got to, `Admin > Promotions > Catalog Price Rules > Add New Rule`. Then under `Rule Information > Customer Groups` select what customer group the rule applies to.

Here we select what customer groups the rule applies to.

`Admin > Promotions > Shopping Cart Price Rules > Add New Rule`

`Rule Information > Customer Groups`

Different Tax for different customer groups

`Sales > Tax > Customer Tax Classes > Add New`

`Customers > Customer Groups > Add New Customer Group`

Select Tax Class

#### How can attributes be added to a customer address? How are custom
address attributes you added converted to an order address?

#### Can a customer be added to two customer groups at the same time?

No, a customer can only belog to one customer groups.

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage/Customer/etc/config.xml][Mage/Customer/etc/config.xml]
* [Mage_Customer_Model_Customer][Mage_Customer_Model_Customer]
* [Mage_Customer_Model_Resource_Customer][Mage_Customer_Model_Resource_Customer]
* [Mage_Customer_Model_Customer_Address][Mage_Customer_Model_Customer_Address]

#### Additional Readings

* [Nathan McBride: Customer][brideo.customer]




[brideo.customer]:http://brideo.co.uk/magento-certification-notes/sales/Customers/





[Mage/Customer/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Customer/etc/config.xml
[Mage_Customer_Model_Customer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Customer/Model/Customer.php
[Mage_Customer_Model_Customer::validate]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Customer/Model/Customer.php#L853
[Mage_Customer_Model_Resource_Customer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Customer/Model/Resource/Customer.php
[Mage_Customer_Model_Customer_Address]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Customer/Model/Address.php
