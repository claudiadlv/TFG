import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  uploadButton: {
    alignItems: 'center',
    marginVertical: 20,
  },
  grid: {
    paddingHorizontal: 10,
  },
  imageContainer: {
    width: '48%',
    margin: '1%',
    aspectRatio: 1.5,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cloudIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
});
