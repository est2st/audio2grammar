'use client'

import { useState, useCallback } from 'react'
import { Box, Button, VStack, Text, Container, useToast, Spinner, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@chakra-ui/react'
import { useDropzone } from 'react-dropzone'

export default function GrammarAnalysis() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [text, setText] = useState<string>("")
  const toast = useToast()
  const [selectedSentence, setSelectedSentence] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': [],
      'video/*': []
    },
    multiple: false
  })

  const analyzeGrammar = async () => {
    if (!file) return

    setIsLoading(true)
    setAnalysis([])
    setText("")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed')
      }

      const { transcript } = await transcriptionResponse.json()
      setText(transcript);

      const languageToolResponse = await fetch('/api/grammar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcript }),
      })

      if (!languageToolResponse.ok) {
        throw new Error('Grammar analysis failed')
      }

      const grammarAnalysis = await languageToolResponse.json()

      const filteredAnalysis = grammarAnalysis.matches.filter((match: any) => {
        const wordCount = match.sentence.split(' ').length
        return wordCount >= 2
      })

      setAnalysis(filteredAnalysis)

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'An error occurred',
        description: 'Failed to analyze the file',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (message: string | null, sentence: any | null) => {
    setModalMessage(message)
    setSelectedSentence(sentence)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalMessage(null)
    setSelectedSentence(null)
  }

  // Highlight errors and split text into sentences with highlights
  const getSentenceSpans = () => {
    const sentenceSpans = text.split(/(?<=[.!?])\s+/).map((sentence, index) => {
      const match = analysis.find((m: any) => m.sentence.trim() === sentence.trim())

      if (match) {
        // Highlight error within the sentence
        const highlightedSentence = (
          <>
            {match.context.text.substring(0, match.context.offset)}
            <span style={{ color: 'orange', textDecoration: 'underline' }}>
              {match.context.text.substring(match.context.offset, match.context.offset + match.context.length)}
            </span>
            {match.context.text.substring(match.context.offset + match.context.length)}
          </>
        )

        return (
          <span
            key={index}
            style={{ cursor: 'pointer', marginRight: '4px' }}
            onClick={() => openModal(null, match)}
          >
            {highlightedSentence}
          </span>
        )
      } else {
        return (
          <span
            key={index}
            style={{ cursor: 'pointer', marginRight: '4px' }}
            onClick={() => openModal('This sentence is fine.', null)}
          >
            {sentence}
          </span>
        )
      }
    })

    return sentenceSpans
  }

  return (
    <Container maxW="container.xl" mt={32} py={10}>
      <VStack spacing={6}>
        <Box
          {...getRootProps()}
          w="100%"
          h="200px"
          border="2px dashed"
          borderColor={isDragActive ? "blue.500" : "gray.300"}
          borderRadius="md"
          p={4}
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          transition="all 0.2s"
        >
          <input {...getInputProps()} />
          {
            isDragActive ?
              <Text>Drop the file here ...</Text> :
              <Text>Drag and drop an audio or video file here, or click to select a file</Text>
          }
        </Box>
        {file && <Text>Selected file: {file.name}</Text>}
        <Button 
          onClick={analyzeGrammar} 
          colorScheme="blue" 
          isDisabled={!file || isLoading}
        >
          {isLoading ? <Spinner size="sm" mr={2} /> : null}
          {isLoading ? 'Analyzing...' : 'Analyze Grammar'}
        </Button>
        {isLoading && (
          <Box textAlign="center">
            <Spinner size="xl" />
            <Text mt={2}>Analyzing your file. This may take a few moments...</Text>
          </Box>
        )}
        {
          text?.length > 0 && (
            <Box w="90%" p={4} borderWidth={1} borderRadius="md">
              {getSentenceSpans()}
            </Box>
          )
        }

        <Box w="100%">
          {analysis.map((match, index) => (
            <Box key={index} mb={4} p={4} borderWidth={1} borderRadius="md">
              <Text fontWeight="bold">{match.sentence}</Text>
              <Text fontWeight="bold">Error:</Text>
              <Text>{match.message}</Text>
              <Text fontWeight="bold" mt={2}>Context:</Text>
              <Text>
                {match.context.text.substring(0, match.context.offset)}
                <Text as="span" color="orange.500" textDecoration="underline">
                  {match.context.text.substring(match.context.offset, match.context.offset + match.context.length)}
                </Text>
                {match.context.text.substring(match.context.offset + match.context.length)}
              </Text>
              <Text fontWeight="bold" mt={2}>Suggestions:</Text>
              <Text>{match.replacements.map((r: any) => r.value).join(', ')}</Text>
            </Box>
          ))}
        </Box>

        <Modal isOpen={isModalOpen} onClose={closeModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Sentence Analysis</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {modalMessage ? (
                <Text>{modalMessage}</Text>
              ) : (
                selectedSentence && (
                  <>
                    <Text fontWeight="bold">Sentence:</Text>
                    <Text>{selectedSentence.sentence}</Text>
                    <Text fontWeight="bold" mt={2}>Error:</Text>
                    <Text>{selectedSentence.message}</Text>
                    <Text fontWeight="bold" mt={2}>Context:</Text>
                    <Text>{selectedSentence.context.text}</Text>
                    <Text fontWeight="bold" mt={2}>Suggestions:</Text>
                    <Text>{selectedSentence.replacements.map((r: any) => r.value).join(', ')}</Text>
                  </>
                )
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={closeModal}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}
