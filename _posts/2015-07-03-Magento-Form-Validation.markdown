---
layout: post
title:  Magento Form Validation
date:   2015-07-03 22:30:00
categories: Magento
---

Magento built in form validation full article at [inchoo.net][inchoo].

{% highlight js %}
'validate-no-html-tags'         => 'HTML tags are not allowed'
'validate-select'               => 'Please select an option.'
'required-entry'                => 'This is a required field.'
'validate-number'               => 'Please enter a valid number in this field.'
'validate-number-range'         => 'The value is not within the specified range.'
'validate-digits'               => 'Please use numbers only in this field. Please avoid spaces or other characters such as dots or commas.'
'validate-digits-range'         => 'The value is not within the specified range.'
'validate-alpha'                => 'Please use letters only (a-z or A-Z) in this field.'
'validate-code'                 => 'Please use only letters (a-z), numbers (0-9) or underscore(_) in this field, first character should be a letter.'
'validate-alphanum'             => 'Please use only letters (a-z or A-Z) or numbers (0-9) only in this field. No spaces or other characters are allowed.'
'validate-alphanum-with-spaces' => 'Please use only letters (a-z or A-Z), numbers (0-9) or spaces only in this field.'
'validate-street'               => 'Please use only letters (a-z or A-Z) or numbers (0-9) or spaces and # only in this field.'
'validate-phoneStrict'          => 'Please enter a valid phone number. For example (123) 456-7890 or 123-456-7890.'
'validate-phoneLax'             => 'Please enter a valid phone number. For example (123) 456-7890 or 123-456-7890.'
'validate-fax'                  => 'Please enter a valid fax number. For example (123) 456-7890 or 123-456-7890.'
'validate-date'                 => 'Please enter a valid date.'
'validate-date-range'           => 'The From Date value should be less than or equal to the To Date value.'
'validate-email'                => 'Please enter a valid email address. For example johndoe@domain.com.'
'validate-emailSender'          => 'Please use only visible characters and spaces.'
'validate-password'             => 'Please enter 6 or more characters. Leading or trailing spaces will be ignored.'
'validate-admin-password'       => 'Please enter 7 or more characters. Password should contain both numeric and alphabetic characters.'
'validate-both-passwords'       => 'Please make sure your passwords match.'
'validate-url'                  => 'Please enter a valid URL. Protocol is required (http://, https:// or ftp://)'
'validate-clean-url'            => 'Please enter a valid URL. For example http://www.example.com or www.example.com'
'validate-identifier'           => 'Please enter a valid URL Key. For example "example-page", "example-page.html" or "anotherlevel/example-page".'
'validate-xml-identifier'       => 'Please enter a valid XML-identifier. For example something_1, block5, id-4.'
'validate-ssn'                  => 'Please enter a valid social security number. For example 123-45-6789.'
'validate-zip'                  => 'Please enter a valid zip code. For example 90602 or 90602-1234.'
'validate-zip-international'    => 'Please enter a valid zip code.'
'validate-date-au'              => 'Please use this date format: dd/mm/yyyy. For example 17/03/2006 for the 17th of March, 2006.'
'validate-currency-dollar'      => 'Please enter a valid $ amount. For example $100.00.'
'validate-one-required'         => 'Please select one of the above options.'
'validate-one-required-by-name' => 'Please select one of the options.'
'validate-not-negative-number'  => 'Please enter a number 0 or greater in this field.'
'validate-zero-or-greater'      => 'Please enter a number 0 or greater in this field.'
'validate-greater-than-zero'    => 'Please enter a number greater than 0 in this field.'
'validate-state'                => 'Please select State/Province.'
'validate-new-password'         => 'Please enter 6 or more characters. Leading or trailing spaces will be ignored.'
'validate-cc-number'            => 'Please enter a valid credit card number.'
'validate-cc-type'              => 'Credit card number does not match credit card type.'
'validate-cc-type-select'       => 'Card type does not match credit card number.'
'validate-cc-exp'               => 'Incorrect credit card expiration date.'
'validate-cc-cvn'               => 'Please enter a valid credit card verification number.'
'validate-ajax'                 => ''
'validate-data'                 => 'Please use only letters (a-z or A-Z), numbers (0-9) or underscore(_) in this field, first character should be a letter.'
'validate-css-length'           => 'Please input a valid CSS-length. For example 100px or 77pt or 20em or .5ex or 50%.'
'validate-length'               => 'Text length does not satisfy specified text range.'
'validate-percents'             => 'Please enter a number lower than 100.'
'validate-cc-ukss'              => 'Please enter issue number or start date for switch/solo card type.'
{% endhighlight %}


[inchoo]:http://inchoo.net/magento/out-of-the-box-form-validation-in-magento/
