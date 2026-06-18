import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  iconCircle: {
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4A56E2',
    padding: 15,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 40,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8AA7B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D47A1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 40,
    alignSelf: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#4A56E2', // Mismo color azul corporativo que tus iconos
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  }
});

export default styles;