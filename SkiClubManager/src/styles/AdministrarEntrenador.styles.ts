import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A56E2',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  picker: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    marginBottom: 15,
  },
  datePickerButton: {
    backgroundColor: '#4A56E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerText: {
    color: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4A56E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
