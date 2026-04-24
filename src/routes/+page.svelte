<div class="info-container">
    <p>
        <em><strong>Conditions of Observation</strong></em> is a photographic
        research tool developed for my Master of Architecture thesis at the
        University of Toronto. All photographs are my own, taken primarily with
        my iPhone between 2017 and 2025 as part of my ongoing practice of <span class="noticing">noticing</span>.

        <br /><br />
        This thesis explores the act of informal walking and photographic observation as a way to encourage a material sense of place in the urban environment. Through enacting a photographic framing of contingent material conditions throughout the city, this thesis encourages others to see the city and its mundane as if it was for the first time.

        <br /><br />
        This platform is open source, collaborative, and anti-technocratic. 

        <br /><br />
        Warmly, <br />
        <blur><em>Scott Christian McCallum</em></blur>
        <br />
        <a href="https://www.instagram.com/slow.practice/" target="_blank" rel="noopener noreferrer">@slow.practice</a>
    </p>
</div>

<style>
    .info-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 6rem 2rem 0 2rem;
        user-select: text;
        -webkit-user-select: text;
    }

    p {
        max-width: 500px;
        text-align: justify;
        line-height: 1.6;
        user-select: text;
        -webkit-user-select: text;
    }

    blur {
        transition: filter 0.05s;
        will-change: filter;
        -webkit-backface-visibility: hidden;
        -webkit-transform: translateZ(0);
        user-select: text;
        -webkit-user-select: text;
    }

    blur:hover {
        filter: blur(4px);
        -webkit-filter: blur(4px);
    }

    .noticing {
        text-decoration: none;
        background-image: linear-gradient(to right, currentColor 33%, transparent 33%);
        background-position: bottom;
        background-size: 4px 1px;
        background-repeat: repeat-x;
        user-select: text;
        -webkit-user-select: text;
    }

    a {
        color: inherit;
        text-decoration: none;
        font-style: italic;
        transition: filter 0.05s;
        will-change: filter;
        -webkit-backface-visibility: hidden;
        -webkit-transform: translateZ(0);
        user-select: text;
        -webkit-user-select: text;
    }

    a:hover {
        filter: blur(4px);
        -webkit-filter: blur(4px);
    }

    em, strong {
        user-select: text;
        -webkit-user-select: text;
    }

    @media (max-width: 499px) {
        blur:hover {
            filter: none;
        }
    }
</style>
