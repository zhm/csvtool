$(function() {
  ChoiceMaker = {};
  ClassMaker = {};

  ClassMaker.convert = function() {
    source = $('.left-text').val();

    if (!source) {
      $('.right-text').html('');
      return;
    }

    lines = source.split('\n');

    var classes = [];
    var classificationSet = currentNode = { name: 'Classification Set', description: 'Classification Set', items: [] };
    var currentIndent = 1;

    _.each(lines, function(line) {
      line = $.trim(line);

      if (line.length === 0)
        return;

      var parts = line.split(',');
      var indent = 0;
      var indentedParts;

      for (var i = 0; i < parts.length; ++i) {
        if ($.trim(parts[i]).length === 0) {
          indent++;
        } else {
          indentedParts = parts.slice(i);
          break;
        }
      }

      if (!indentedParts || indentedParts.length === 0 || $.trim(indentedParts[0]).length === 0) {
        return;
      }

      parts = indentedParts;

      var label = $.trim(parts[0]);
      var value = $.trim(parts.length > 1 && $.trim(parts[1]).length > 0 ? parts[1] : parts[0]);

      if (indent > currentIndent) {
        // a new level of nesting needs to be created
        var children = currentNode.child_classifications || currentNode.items;
        currentNode = {
          parent: currentNode,
          label: label,
          value: value,
          child_classifications: []
        };
        children.push(currentNode);
      } else if (indent < currentIndent) {
        // reached the end of a level of nesting, walk back up to find out which level of nesting the line is at
        var diff = (currentIndent - indent);
        var theParent = currentNode;

        do {
          theParent = theParent.parent;
        } while (--diff);

        if (!theParent)
          theParent = classificationSet;
        else
          theParent = theParent.parent;

        currentNode = {
          parent: theParent,
          label: label,
          value: value,
          child_classifications: []
        };

        if (theParent) {
          var children = theParent.child_classifications || theParent.items;
          children.push(currentNode);
        }
      } else {
        // the line is the same as the last, no change in hierarchy
        var children = currentNode.parent.child_classifications || currentNode.parent.items;

        currentNode = {
          parent: currentNode.parent,
          label: label,
          value: value,
          child_classifications: []
        };

        children.push(currentNode);
      }

      currentIndent = indent;
    });

    var withoutCircularReferences = {};

    var recurse = function(items) {
      var result = [];
      _.each(items, function(item) {
        result.push({
          label: item.label,
          value: item.value,
          child_classifications: recurse(item.child_classifications)
        });
      });
      return result;
    };

    withoutCircularReferences.name = classificationSet.name;
    withoutCircularReferences.description = classificationSet.description;
    withoutCircularReferences.items = recurse(classificationSet.items);

    $('.right-text').html(JSON.stringify(withoutCircularReferences, null, '  '));
  };

  ClassMaker.convertToCSV = function() {
    source = $('.right-text').val();

    if (!source) {
      $('.left-text').html('');
      return;
    }

    try {
      json = JSON.parse(source);
    } catch (ex) {
      alert('There\'s an error in the JSON.');
      return;
    }

    var eachLevel = function(elements, depth) {
      var prefix = '';
      for (var i = 0; i < depth; ++i)
        prefix += ',';

      var lines = [];

      for (var i = 0; i < elements.length; ++i) {
        lines.push(prefix + (elements[i].label || '') + ',' + (elements[i].value || ''));
        if (elements[i].child_classifications && elements[i].child_classifications.length > 0) {
          lines = lines.concat(eachLevel(elements[i].child_classifications, depth + 1));
        }
      }

      return lines;
    }

    csv = eachLevel(json.items, 0);

    $('.left-text').html(csv.join('\n'));
  }

  ChoiceMaker.convert = function() {
    source = $('.left-text').val();

    if (!source) {
      $('.right-text').html('');
      return;
    }

    lines = source.split('\n');

    choices = [];

    _.each(lines, function(line) {
      var parts = line.split(',');

      if (parts.length === 0 || $.trim(parts[0]).length === 0)
        return;

      choices.push({
        label: $.trim(parts[0]),
        value: $.trim(parts.length > 1 && $.trim(parts[1]).length > 0 ? parts[1] : parts[0])
      });
    });

    choiceList = {
      name: 'Choice List',
      description: 'Choice List',
      choices: choices
    };

    $('.right-text').html(JSON.stringify(choiceList, null, '  '));
  };

  $('.left-text').keyup(function() {
    ClassMaker.convert();
  });
  $('.right-text').keyup(function() {
    ClassMaker.convertToCSV();
  });
});

