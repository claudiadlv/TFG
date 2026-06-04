import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 30,
    alignItems: 'stretch',
    backgroundColor: '#fff',
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 15,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textInsideInput: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 25,
  },
});
