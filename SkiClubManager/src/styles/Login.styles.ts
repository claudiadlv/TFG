import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
    },
    input: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
      marginBottom: 15,
    },
    registerText: {
      color: '#007BFF',
      marginTop: 15,
      textAlign: 'center',
    },

    loginButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    elevation: 2, // sombra para Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  });

  export default styles;