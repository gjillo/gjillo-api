const resolver = {
  FieldValue: {
    __resolveType(obj) {
      if (obj.text_value ?? false) {
        return 'FieldTextValue';
      }

      if (obj.date_value ?? false) {
        return 'FieldDateValue';
      }

      if (obj.number_value ?? false) {
        return 'FieldNumberValue';
      }

      if (obj.checkbox_value ?? false) {
        return 'FieldCheckboxValue';
      }

      if (obj.select_value ?? false) {
        return 'FieldSelectValue';
      }

      return null;
    },
  },
};

export { resolver };