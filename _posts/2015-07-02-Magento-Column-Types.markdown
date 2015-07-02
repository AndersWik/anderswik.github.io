---
layout: post
title:  Mysql/Magento Column Types
date:   2015-07-02 22:30:00
categories: Magento
---

Mysql/Magento types of columns that can be used.
Reference: `lib\Varien\Db\Ddl\Table.php`

{% highlight php %}
<?php
$installer->getTable('catalog/eav_attribute'),
    'tooltip',
    array(
        'type'      => Varien_Db_Ddl_Table::TYPE_TEXT,
        'nullable'  => true,
        'comment'   => 'Tooltip'
    )
?>
{% endhighlight %}

Types of columns

{% highlight php %}
<?php
    const TYPE_BOOLEAN          = 'boolean';
    const TYPE_SMALLINT         = 'smallint';
    const TYPE_INTEGER          = 'integer';
    const TYPE_BIGINT           = 'bigint';
    const TYPE_FLOAT            = 'float';
    const TYPE_NUMERIC          = 'numeric';
    const TYPE_DECIMAL          = 'decimal';
    const TYPE_DATE             = 'date';
    const TYPE_TIMESTAMP        = 'timestamp'; // Capable to support date-time from 1970 + auto-triggers in some RDBMS
    const TYPE_DATETIME         = 'datetime'; // Capable to support long date-time before 1970
    const TYPE_TEXT             = 'text';
    const TYPE_BLOB             = 'blob'; // Used for back compatibility, when query param can't use statement options
    const TYPE_VARBINARY        = 'varbinary'; // A real blob, stored as binary inside DB
?>
{% endhighlight %}

Deprecated column types, support is left only in MySQL adapter.

{% highlight php %}
<?php
    const TYPE_TINYINT          = 'tinyint';        // Internally converted to TYPE_SMALLINT
    const TYPE_CHAR             = 'char';           // Internally converted to TYPE_TEXT
    const TYPE_VARCHAR          = 'varchar';        // Internally converted to TYPE_TEXT
    const TYPE_LONGVARCHAR      = 'longvarchar';    // Internally converted to TYPE_TEXT
    const TYPE_CLOB             = 'cblob';          // Internally converted to TYPE_TEXT
    const TYPE_DOUBLE           = 'double';         // Internally converted to TYPE_FLOAT
    const TYPE_REAL             = 'real';           // Internally converted to TYPE_FLOAT
    const TYPE_TIME             = 'time';           // Internally converted to TYPE_TIMESTAMP
    const TYPE_BINARY           = 'binary';         // Internally converted to TYPE_BLOB
    const TYPE_LONGVARBINARY    = 'longvarbinary';  // Internally converted to TYPE_BLOB
?>
{% endhighlight %}

Default and maximal TEXT and BLOB columns sizes we can support for different DB systems.

{% highlight php %}
<?php
    const DEFAULT_TEXT_SIZE     = 1024;
    const MAX_TEXT_SIZE         = 2147483648;
    const MAX_VARBINARY_SIZE    = 2147483648;
?>
{% endhighlight %}

Default values for timestampses - fill with current timestamp on inserting record, on changing and both cases

{% highlight php %}
<?php
    const TIMESTAMP_INIT_UPDATE = 'TIMESTAMP_INIT_UPDATE';
    const TIMESTAMP_INIT        = 'TIMESTAMP_INIT';
    const TIMESTAMP_UPDATE      = 'TIMESTAMP_UPDATE';
?>
{% endhighlight %}

Actions used for foreign keys

{% highlight php %}
<?php
    const ACTION_CASCADE        = 'CASCADE';
    const ACTION_SET_NULL       = 'SET NULL';
    const ACTION_NO_ACTION      = 'NO ACTION';
    const ACTION_RESTRICT       = 'RESTRICT';
    const ACTION_SET_DEFAULT    = 'SET DEFAULT';
?>
{% endhighlight %}
