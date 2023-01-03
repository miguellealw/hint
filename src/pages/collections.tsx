import { useRef, useState } from "react";
import { Button, createStyles, Group, SimpleGrid, Title, Tooltip, Text, Loader, Box } from "@mantine/core"
import { IconFolderPlus } from "@tabler/icons";
import { type NextPage } from "next";
import MainLayout from "./components/layouts/MainLayout";
import { InputWithButton as SearchBar } from "./components/InputWithButton";
// import CreateHintModal from "./components/CreateHintModal";
import CreateCollectionModal from "./components/Modals/CollectionModal";
import { trpc } from "../utils/trpc";
import { type Collection } from "@prisma/client";
import Link from "next/link";
import { useHotkeys, useMediaQuery } from "@mantine/hooks";
import useCollectionForm from "../hooks/useCollectionForm";
import useUnauthed from "../hooks/useUnauthed";
import { useCreateCollection } from "../hooks/collectionHooks";

const useStyles = createStyles((theme) => ({
  collectionCard: {
    display: "flex",
    // alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",

    listStyleType: "none",
    position: "relative",
    backgroundColor: theme.colors.indigo[0],
    padding: theme.spacing.xl,
    borderRadius: theme.radius.sm,
    cursor: "pointer",

    "&:hover": {
      backgroundColor: theme.colors.indigo[1],
    }
  },
}));


const Collections: NextPage = () => {
  const [isCollectionModalOpen, setCollectionModalOpen] = useState(false);
  const { status } = useUnauthed();
  const [searchValue, setSearchValue] = useState("");
  const searchBarRef = useRef<HTMLInputElement>(null);

  const collectionForm = useCollectionForm("");

  const { classes } = useStyles();
  useHotkeys([
    // ["c", () => setHintModalOpen(true)],
    ["o", () => setCollectionModalOpen(true)],
    ["/", () => searchBarRef.current?.focus()]
  ])


  // trpc
  const { 
    data: collections, 
    isLoading: isLoadingCollections, 
    isSuccess: isSuccessCollections 
  } = trpc.collection.getAll.useQuery({
    searchValue
  }, {
    queryKey: ["collection.getAll", { searchValue }],
  });
  const mutation = useCreateCollection({
    onMutateCb: () => { setCollectionModalOpen(false) },
    onSuccessCb: () => { setCollectionModalOpen(false) },
    onErrorCb: (newCollection) => {
      collectionForm.setFieldValue("name", newCollection.name)
      setCollectionModalOpen(true)
    }
  });

  if (status === "loading") {
    return (
      <Box sx={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader color="indigo" />
      </Box>
    )
  }

  // if (status === "authenticated") {
  return (
    <MainLayout containerSize="md">
      <CreateCollectionModal
        isModalOpen={isCollectionModalOpen}
        setModalOpen={setCollectionModalOpen}
        form={collectionForm}
        onClose={() => {
          setCollectionModalOpen(false);
          collectionForm.reset();
        }}
        onConfirm={collectionForm.onSubmit((values) => {
          mutation.mutate({ name: values.name })
        }, collectionForm.handleEditCollectionError)}
        onCancel={() => {
          setCollectionModalOpen(false)
          collectionForm.reset();
        }}
      />
      {/* <CreateHintModal 
          isModalOpen={isHintModalOpen} setModalOpen={setHintModalOpen} 
          onConfirm = {(e) => {}}
          onCancel = {() => { setHintModalOpen(false); }}
        /> */}

      <Group position="apart" align="center" my="xl">
        <Title align="center">My Collections</Title>

        {/* TODO: show cmd or ctrl depending on OS */}
        <Group>
          {/* <Tooltip label="Create Hint ('C')">
              <Button variant="subtle" color="indigo.5" leftIcon={<IconFilePlus size={18} />} onClick={() => setHintModalOpen(true)}>
                Create Hint
              </Button>
            </Tooltip> */}
          <Tooltip label="Create Collection ('O')">

            <Button
              color="indigo.8"
              leftIcon={<IconFolderPlus size={18} />}
              onClick={() => { setCollectionModalOpen(true); }}
            >
              Create Collection
            </Button>
          </Tooltip>
        </Group>
      </Group>

      <SearchBar mb="xl"
        ref={searchBarRef}
        value={searchValue}
        onChange={(e) => { setSearchValue(e.currentTarget.value) }}
      />


      {isLoadingCollections && !isSuccessCollections ? (
        <Box style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Loader color="indigo" />
        </Box>
      ) : <CollectionsList collections={collections} classes={classes} />}

    </MainLayout>
  )
  // }

}

// TODO: change any to correct type
const CollectionsList = ({ collections, classes }: { collections: Collection[] | undefined, classes: any }) => {
  const largeScreen = useMediaQuery('(min-width: 900px)');

  return (
    <ul style={{ paddingLeft: 0 }}>
      <SimpleGrid cols={largeScreen ? 3 : 1}>
        {collections?.length === 0 ?
          <Text align="center" c="gray.5">You don&apos;t have any collections yet.</Text> :
          collections?.map(collection => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <li className={classes.collectionCard}>
                <Text fz="lg" fw={600} c="indigo.9">{collection.name}</Text>
                <Text fz="xs" c="indigo.4">5 hints</Text>
              </li>
            </Link>
          ))
        }
      </SimpleGrid>
    </ul>
  )
}


export default Collections;